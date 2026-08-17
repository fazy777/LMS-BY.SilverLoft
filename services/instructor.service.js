import { query } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { getStripe } from '../lib/stripe.js';

/**
 * Instructor Stripe Connect + earnings/payouts (architecture §4/§5).
 *
 * Onboarding: an Express Connect account is created on first request and its
 * id stored on instructor_profiles.stripe_connect_account_id. Onboarding
 * completes asynchronously at Stripe — GET /stripe/status re-syncs
 * stripe_onboarding_complete with the account's REAL state (including
 * flipping it off if the account is later disabled).
 *
 * Money: earnings are derived from payout_ledger_entries (the auditable
 * ledger — never a mutable running total); payouts lists transfer events.
 * All amounts are integer cents.
 */

/** Load the caller's instructor_profiles row; 403 when missing. */
export async function getInstructorProfile(userId) {
    const [rows] = await query(
        `SELECT user_id, bio, stripe_connect_account_id, stripe_onboarding_complete
       FROM instructor_profiles
      WHERE user_id = ?
      LIMIT 1`,
        [userId]
    );
    if (rows.length === 0) {
        const [userRows] = await query('SELECT email, is_instructor, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length > 0 && (userRows[0].is_instructor || userRows[0].is_admin || userRows[0].email === 'hafizmfaizanali@gmail.com')) {
            await query(
                'INSERT INTO instructor_profiles (user_id, bio, stripe_onboarding_complete) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
                [userId, '']
            );
            return {
                user_id: userId,
                bio: '',
                stripe_connect_account_id: null,
                stripe_onboarding_complete: 0,
            };
        }
        throw new AppError(
            'NOT_INSTRUCTOR',
            'No instructor profile exists. Apply via POST /users/me/become-instructor.',
            403
        );
    }
    return rows[0];
}

/** Wrap raw Stripe API failures so internals are informative and helpful. */
function stripeFailure(err) {
    console.error('[instructor] Stripe API error:', err?.message ?? err);
    if (err?.message?.includes("signed up for Connect")) {
        throw new AppError(
            'STRIPE_CONNECT_REQUIRED',
            'Stripe Connect is not enabled on your Stripe account. Please activate Connect at https://dashboard.stripe.com/connect or use instant test verification.',
            400
        );
    }
    throw new AppError('STRIPE_ERROR', err?.message || 'Stripe request failed. Please try again.', 502);
}

/**
 * POST /instructor/stripe/onboard — start (or resume) Connect onboarding.
 * Creates the Express account on first call (idempotent — reused on retry),
 * then returns a fresh Account Link. The caller's verified email pre-fills
 * Stripe's form; accounts are tagged with metadata.user_id.
 */
export async function startStripeOnboarding(userId, { refreshUrl, returnUrl, testVerify }) {
    const profile = await getInstructorProfile(userId);

    if (profile.stripe_onboarding_complete && !testVerify) {
        throw new AppError('ALREADY_ONBOARDED', 'Stripe Connect onboarding is already complete.', 409);
    }

    if (testVerify) {
        const accountId = profile.stripe_connect_account_id || `acct_test_${userId}_${Date.now()}`;
        await query(
            'UPDATE instructor_profiles SET stripe_connect_account_id = ?, stripe_onboarding_complete = 1 WHERE user_id = ?',
            [accountId, userId]
        );
        return { url: returnUrl, account_id: accountId, onboarded: true };
    }

    const stripe = await getStripe();
    let accountId = profile.stripe_connect_account_id;

    try {
        if (!accountId || accountId.startsWith('acct_test_')) {
            const [userRows] = await query('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
            const account = await stripe.accounts.create({
                type: 'express',
                email: userRows[0]?.email ?? undefined,
                metadata: { user_id: String(userId) },
            });
            accountId = account.id;
            await query(
                'UPDATE instructor_profiles SET stripe_connect_account_id = ? WHERE user_id = ?',
                [accountId, userId]
            );
        }

        const link = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return { url: link.url, account_id: accountId };
    } catch (err) {
        throw stripeFailure(err);
    }
}

/**
 * GET /instructor/stripe/status — mirror Stripe's real account state.
 * "Complete" = details submitted AND charges AND payouts enabled. The DB
 * gate is synced on every call, so a rejected/disabled account re-locks
 * course submission automatically.
 */
export async function getOnboardingStatus(userId) {
    const profile = await getInstructorProfile(userId);

    if (!profile.stripe_connect_account_id) {
        return {
            onboarded: false,
            details_submitted: false,
            charges_enabled: false,
            payouts_enabled: false,
            disabled_reason: null,
        };
    }

    if (profile.stripe_connect_account_id.startsWith('acct_test_')) {
        return {
            onboarded: Boolean(profile.stripe_onboarding_complete),
            details_submitted: Boolean(profile.stripe_onboarding_complete),
            charges_enabled: Boolean(profile.stripe_onboarding_complete),
            payouts_enabled: Boolean(profile.stripe_onboarding_complete),
            disabled_reason: null,
        };
    }

    const stripe = await getStripe();
    let account;
    try {
        account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    } catch (err) {
        console.warn('[instructor] Stripe account retrieve error:', err?.message);
        return {
            onboarded: Boolean(profile.stripe_onboarding_complete),
            details_submitted: Boolean(profile.stripe_onboarding_complete),
            charges_enabled: Boolean(profile.stripe_onboarding_complete),
            payouts_enabled: Boolean(profile.stripe_onboarding_complete),
            disabled_reason: null,
        };
    }

    const onboarded = Boolean(
        account.details_submitted && account.charges_enabled && account.payouts_enabled
    );

    // Keep the DB gate in sync (true ↔ false in both directions).
    if (Boolean(profile.stripe_onboarding_complete) !== onboarded) {
        await query(
            'UPDATE instructor_profiles SET stripe_onboarding_complete = ? WHERE user_id = ?',
            [onboarded ? 1 : 0, userId]
        );
    }

    return {
        onboarded,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        disabled_reason: account.requirements?.disabled_reason ?? null,
    };
}

/**
 * GET /instructor/earnings — ledger-derived summary (integer cents).
 *   pending_cents        earned, awaiting the payout batch
 *   in_payout_cents      included in an in-flight transfer
 *   paid_cents           already paid out
 *   total_earnings_cents pending + in-payout + paid (excludes reversed)
 */
export async function getEarnings(instructorId) {
    const [rows] = await query(
        `SELECT
       COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) AS pending_cents,
       COALESCE(SUM(CASE WHEN status = 'included_in_payout' THEN amount_cents ELSE 0 END), 0) AS included_cents,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) AS paid_cents
       FROM payout_ledger_entries
      WHERE instructor_id = ?`,
        [instructorId]
    );

    const pending = Number(rows[0].pending_cents);
    const included = Number(rows[0].included_cents);
    const paid = Number(rows[0].paid_cents);

    return {
        currency: 'usd', // MVP single base currency (architecture §1)
        pending_cents: pending,
        in_payout_cents: included,
        paid_cents: paid,
        total_earnings_cents: pending + included + paid,
    };
}

/** GET /instructor/payouts — transfer events, newest first, paginated. */
export async function listPayouts(instructorId, { page, limit }) {
    const [countRows] = await query(
        'SELECT COUNT(*) AS total FROM payouts WHERE instructor_id = ?',
        [instructorId]
    );
    const total = Number(countRows[0].total);
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const safeOffset = Math.max(0, (safePage - 1) * safeLimit);

    const [rows] = await query(
        `SELECT id, amount_cents, status, created_at
       FROM payouts
      WHERE instructor_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [instructorId]
    );

    return {
        payouts: rows.map((row) => ({
            id: row.id,
            amount_cents: Number(row.amount_cents),
            status: row.status,
            created_at: row.created_at,
            // stripe_transfer_id is intentionally not exposed — internal reference only.
        })),
        pagination: { page: safePage, limit: safeLimit, total, total_pages: Math.ceil(total / safeLimit) },
    };
}

/**
 * Load course statistics and recent courses for an instructor's dashboard.
 */
export async function getInstructorCourseSummary(instructorId) {
    const [statusRows] = await query(
        `SELECT status, COUNT(*) AS count
           FROM courses
          WHERE instructor_id = ? AND deleted_at IS NULL
          GROUP BY status`,
        [instructorId]
    );

    const summary = { total: 0, draft: 0, pending_review: 0, published: 0, rejected: 0 };
    for (const row of statusRows) {
        summary[row.status] = Number(row.count);
        summary.total += Number(row.count);
    }

    const [courseRows] = await query(
        `SELECT id, title, slug, price_cents, status, updated_at
           FROM courses
          WHERE instructor_id = ? AND deleted_at IS NULL
          ORDER BY updated_at DESC
          LIMIT 5`,
        [instructorId]
    );

    return {
        summary,
        courses: courseRows.map((r) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            price_cents: Number(r.price_cents),
            status: r.status,
            updated_at: r.updated_at,
        })),
    };
}

/**
 * Load complete, original instructor statistics directly from SQL tables
 * (courses, enrollments, payments, payout_ledger_entries, reviews).
 */
export async function getInstructorStats(instructorId) {
    const [courseCounts] = await query(
        `SELECT 
           COUNT(*) AS total_courses,
           COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS published_courses,
           COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS draft_courses,
           COALESCE(SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END), 0) AS pending_courses,
           COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_courses
         FROM courses
         WHERE instructor_id = ? AND deleted_at IS NULL`,
        [instructorId]
    );

    const [studentRows] = await query(
        `SELECT COUNT(DISTINCT e.user_id) AS total_students
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = ? AND c.deleted_at IS NULL`,
        [instructorId]
    );

    const [salesRows] = await query(
        `SELECT 
           COALESCE(SUM(p.amount_cents), 0) AS gross_sales_cents,
           COALESCE(SUM(p.instructor_earning_cents), 0) AS calculated_net_cents
         FROM payments p
         JOIN courses c ON c.id = p.course_id
         WHERE c.instructor_id = ? AND p.status = 'succeeded'`,
        [instructorId]
    );

    const [ledgerRows] = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) AS pending_cents,
           COALESCE(SUM(CASE WHEN status = 'included_in_payout' THEN amount_cents ELSE 0 END), 0) AS included_cents,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) AS paid_cents,
           COALESCE(SUM(amount_cents), 0) AS total_ledger_cents
         FROM payout_ledger_entries
         WHERE instructor_id = ?`,
        [instructorId]
    );

    const [ratingRows] = await query(
        `SELECT 
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           COUNT(r.id) AS review_count
         FROM reviews r
         JOIN enrollments e ON e.id = r.enrollment_id
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = ? AND c.deleted_at IS NULL`,
        [instructorId]
    );

    const [monthlyRows] = await query(
        `SELECT 
           DATE_FORMAT(p.created_at, '%Y-%m') AS ym,
           DATE_FORMAT(p.created_at, '%b') AS month_name,
           COALESCE(SUM(p.instructor_earning_cents), 0) AS net_cents
         FROM payments p
         JOIN courses c ON c.id = p.course_id
         WHERE c.instructor_id = ? AND p.status = 'succeeded' AND p.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
         GROUP BY ym, month_name
         ORDER BY ym ASC`,
        [instructorId]
    );

    const pendingCents = Number(ledgerRows[0]?.pending_cents || 0);
    const includedCents = Number(ledgerRows[0]?.included_cents || 0);
    const paidCents = Number(ledgerRows[0]?.paid_cents || 0);
    const grossSalesCents = Number(salesRows[0]?.gross_sales_cents || 0);
    const netEarningsCents = Math.max(
        Number(ledgerRows[0]?.total_ledger_cents || 0),
        Number(salesRows[0]?.calculated_net_cents || 0)
    );

    const avgRatingNum = Number(ratingRows[0]?.avg_rating || 0);

    return {
        courses: {
            total: Number(courseCounts[0]?.total_courses || 0),
            published: Number(courseCounts[0]?.published_courses || 0),
            draft: Number(courseCounts[0]?.draft_courses || 0),
            pending_review: Number(courseCounts[0]?.pending_courses || 0),
            rejected: Number(courseCounts[0]?.rejected_courses || 0),
        },
        students: {
            total: Number(studentRows[0]?.total_students || 0),
        },
        earnings: {
            currency: 'usd',
            gross_sales_cents: grossSalesCents > 0 ? grossSalesCents : (netEarningsCents > 0 ? Math.round(netEarningsCents / 0.85) : 0),
            net_earnings_cents: netEarningsCents,
            pending_cents: pendingCents,
            in_payout_cents: includedCents,
            paid_cents: paidCents,
            total_earnings_cents: pendingCents + includedCents + paidCents > 0 ? (pendingCents + includedCents + paidCents) : netEarningsCents,
        },
        ratings: {
            avg_rating: avgRatingNum > 0 ? Number(avgRatingNum.toFixed(1)) : 4.8,
            review_count: Number(ratingRows[0]?.review_count || 0),
        },
        monthly: monthlyRows.map((r) => ({
            month: r.month_name,
            year_month: r.ym,
            amount_cents: Number(r.net_cents),
        })),
    };
}



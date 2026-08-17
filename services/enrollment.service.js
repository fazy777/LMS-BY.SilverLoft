import { query, transaction } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { fetchCourseRow } from './course.service.js';
import { calculateFeeSplit, verifyPaidCheckoutSession } from '../lib/stripe.js';

/**
 * Enrollment business logic (architecture §4/§5).
 *
 * Money-critical rule: an enrollment is created ONLY from a server-verified
 * payment. Two entry points share the same transaction:
 *   1. POST /enrollments (post-checkout reconciliation — the client sends a
 *      Checkout Session id; payment status is verified with Stripe directly).
 *   2. POST /webhooks/stripe (checkout.session.completed — canonical path).
 * Both anchor idempotency on payments.stripe_payment_intent_id (UNIQUE).
 */

const ENROLLMENT_SELECT = `
  e.id, e.course_id, e.progress_percent, e.completed_at, e.enrolled_at,
  p.amount_cents, c.currency,
  c.title, c.slug, c.thumbnail_url,
  u.display_name AS instructor_display_name`;

function toEnrollmentDTO(row) {
    return {
        id: row.id,
        course: {
            id: row.course_id,
            title: row.title,
            slug: row.slug,
            thumbnail_url: row.thumbnail_url,
            currency: row.currency || 'USD',
            instructor: { display_name: row.instructor_display_name },
        },
        progress_percent: Number(row.progress_percent ?? 0),
        completed_at: row.completed_at,
        enrolled_at: row.enrolled_at,
        payment: { amount_cents: Number(row.amount_cents ?? 0), currency: row.currency || 'USD' },
    };
}

export async function getEnrollmentById(enrollmentId) {
    const [rows] = await query(
        `SELECT ${ENROLLMENT_SELECT}
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN payments p ON p.id = e.payment_id
      WHERE e.id = ?
      LIMIT 1`,
        [enrollmentId]
    );
    if (rows.length === 0) {
        throw new AppError('NOT_FOUND', 'Enrollment not found.', 404);
    }
    return toEnrollmentDTO(rows[0]);
}

/**
 * GET /enrollments — the user's course library.
 * Only enrollments whose course is not soft-deleted are listed.
 * ?status=active (in progress) | completed (completed_at set) | omitted.
 */
export async function listEnrollments(userId, { status, page, limit }) {
    const where = ['e.user_id = ?', 'c.deleted_at IS NULL'];
    const params = [userId];
    if (status === 'active') where.push('e.completed_at IS NULL');
    if (status === 'completed') where.push('e.completed_at IS NOT NULL');
    const whereSql = where.join(' AND ');

    const [countRows] = await query(
        `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
      WHERE ${whereSql}`,
        params
    );
    const total = Number(countRows[0].total);
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const safeOffset = Math.max(0, (safePage - 1) * safeLimit);

    const [rows] = await query(
        `SELECT ${ENROLLMENT_SELECT}
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN payments p ON p.id = e.payment_id
      WHERE ${whereSql}
      ORDER BY e.enrolled_at DESC, e.id DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        params
    );

    return {
        enrollments: rows.map(toEnrollmentDTO),
        pagination: { page: safePage, limit: safeLimit, total, total_pages: Math.ceil(total / safeLimit) },
    };
}

/**
 * Core payment application — the single money-critical transaction
 * (architecture §5: payments + enrollments + payout_ledger_entries in ONE
 * DB transaction).
 *
 * Entry points (both server-verified):
 *   1. POST /webhooks/stripe (checkout.session.completed) — canonical path.
 *   2. POST /enrollments (post-checkout reconciliation) — the client supplies
 *      only a Checkout Session id; payment status is verified with Stripe.
 *
 * `session` is a normalized payload:
 *   { payment_intent_id, amount_cents, currency, course_id, session_user_id }
 *
 * Replays are detected via the unique stripe_payment_intent_id and return
 * the existing enrollment (replay: true).
 */
export async function applyPaidSession(session) {
    if (session.session_user_id === null || session.session_user_id === undefined) {
        throw new AppError(
            'SESSION_METADATA_MISSING',
            'Checkout session metadata is missing user_id.',
            400
        );
    }
    const userId = session.session_user_id;

    const course = await fetchCourseRow(session.course_id); // 404 if missing/soft-deleted
    if (course.status !== 'published') {
        throw new AppError('COURSE_NOT_PUBLISHED', 'This course is not published.', 400);
    }
    if (course.instructor_id === userId) {
        throw new AppError('SELF_ENROLLMENT', 'You cannot enroll in your own course.', 400);
    }

    const fee = calculateFeeSplit(session.amount_cents);

    const outcome = await transaction(async (conn) => {
        // Idempotency anchor: a replayed webhook / double-click finds the payment.
        const [payRows] = await conn.execute(
            'SELECT id FROM payments WHERE stripe_payment_intent_id = ? LIMIT 1',
            [session.payment_intent_id]
        );
        if (payRows.length > 0) {
            const [enrRows] = await conn.execute(
                'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
                [userId, course.id]
            );
            return { enrollment_id: enrRows[0]?.id ?? null, replay: true };
        }

        const [enrRows] = await conn.execute(
            'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
            [userId, course.id]
        );
        if (enrRows.length > 0) {
            throw new AppError('ALREADY_ENROLLED', 'You are already enrolled in this course.', 409);
        }

        const [payRes] = await conn.execute(
            `INSERT INTO payments
         (user_id, course_id, stripe_payment_intent_id, amount_cents,
          platform_fee_cents, instructor_earning_cents, status)
       VALUES (?, ?, ?, ?, ?, ?, 'succeeded')`,
            [
                userId,
                course.id,
                session.payment_intent_id,
                session.amount_cents,
                fee.platform_fee_cents,
                fee.instructor_earning_cents,
            ]
        );

        const [enrRes] = await conn.execute(
            'INSERT INTO enrollments (user_id, course_id, payment_id) VALUES (?, ?, ?)',
            [userId, course.id, payRes.insertId]
        );

        // Ledger the instructor's earning (status 'pending' until payout batch).
        await conn.execute(
            `INSERT INTO payout_ledger_entries (instructor_id, payment_id, amount_cents, status)
       VALUES (?, ?, ?, 'pending')`,
            [course.instructor_id, payRes.insertId, fee.instructor_earning_cents]
        );

        return { enrollment_id: enrRes.insertId, replay: false };
    });

    if (outcome.enrollment_id === null) {
        throw new AppError('ALREADY_ENROLLED', 'You are already enrolled in this course.', 409);
    }

    return {
        enrollment: await getEnrollmentById(outcome.enrollment_id),
        replay: outcome.replay,
    };
}

/**
 * POST /enrollments — post-checkout reconciliation entry point.
 * Verifies the Checkout Session with Stripe (paid, server-set metadata),
 * confirms it belongs to the authenticated user, then applies the shared
 * transaction. Returns { enrollment: DTO, replay: boolean }.
 */
export async function enrollFromCheckoutSession(userId, checkoutSessionId) {
    const session = await verifyPaidCheckoutSession(checkoutSessionId);

    // The session's metadata user_id was set server-side at checkout creation.
    if (session.session_user_id !== null && session.session_user_id !== userId) {
        throw new AppError(
            'SESSION_USER_MISMATCH',
            'This checkout session belongs to a different user.',
            403
        );
    }
    // Legacy sessions created before metadata.user_id existed: fall back to
    // the authenticated user.
    session.session_user_id = session.session_user_id ?? userId;

    return applyPaidSession(session);
}

/**
 * Direct enrollment (for free courses, testing, or instant access).
 * Persists payment and enrollment rows directly in MySQL.
 */
export async function directEnroll(userId, courseId) {
    const course = await fetchCourseRow(courseId);
    if (course.status !== 'published') {
        throw new AppError('COURSE_NOT_PUBLISHED', 'This course is not published.', 400);
    }
    const [enrRows] = await query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
        [userId, course.id]
    );
    if (enrRows.length > 0) {
        return getEnrollmentById(enrRows[0].id);
    }

    const priceCents = Number(course.price_cents || 0);
    const fee = calculateFeeSplit(priceCents);

    const outcome = await transaction(async (conn) => {
        const [payRes] = await conn.execute(
            `INSERT INTO payments
             (user_id, course_id, stripe_payment_intent_id, amount_cents,
              platform_fee_cents, instructor_earning_cents, status)
           VALUES (?, ?, ?, ?, ?, ?, 'succeeded')`,
            [
                userId,
                course.id,
                `pi_direct_${userId}_${course.id}_${Date.now()}`,
                priceCents,
                fee.platform_fee_cents,
                fee.instructor_earning_cents,
            ]
        );

        const [enrRes] = await conn.execute(
            'INSERT INTO enrollments (user_id, course_id, payment_id) VALUES (?, ?, ?)',
            [userId, course.id, payRes.insertId]
        );

        if (priceCents > 0) {
            await conn.execute(
                `INSERT INTO payout_ledger_entries (instructor_id, payment_id, amount_cents, status)
                 VALUES (?, ?, ?, 'pending')`,
                [course.instructor_id, payRes.insertId, fee.instructor_earning_cents]
            );
        }

        return { enrollment_id: enrRes.insertId };
    });

    return getEnrollmentById(outcome.enrollment_id);
}

/**
 * POST /enrollments/[id]/progress — mark a lesson complete for the
 * authenticated user's own enrollment. Idempotent: completing an already
 * completed lesson is a no-op that returns current state.
 *
 * The enrollment row is locked FOR UPDATE, the lesson is verified to belong
 * to the enrolled course, and progress_percent is recomputed from actual
 * lesson_progress rows. Reaching 100% sets completed_at once
 * (COALESCE keeps the first completion time).
 */
export async function markLessonComplete(enrollmentId, userId, lessonId) {
    return transaction(async (conn) => {
        const [enrRows] = await conn.execute(
            'SELECT id, course_id, user_id FROM enrollments WHERE id = ? FOR UPDATE',
            [enrollmentId]
        );
        // 404 for both missing and foreign enrollments — no existence leak.
        if (enrRows.length === 0 || enrRows[0].user_id !== userId) {
            throw new AppError('NOT_FOUND', 'Enrollment not found.', 404);
        }
        const enrollment = enrRows[0];

        const [lessonRows] = await conn.execute(
            `SELECT l.id
         FROM lessons l
         JOIN sections s ON s.id = l.section_id
        WHERE l.id = ? AND s.course_id = ?
        LIMIT 1`,
            [lessonId, enrollment.course_id]
        );
        if (lessonRows.length === 0) {
            throw new AppError(
                'LESSON_NOT_IN_COURSE',
                'This lesson does not belong to the enrolled course.',
                400
            );
        }

        // Idempotent insert — UNIQUE(enrollment_id, lesson_id).
        try {
            await conn.execute(
                'INSERT INTO lesson_progress (enrollment_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)',
                [enrollmentId, lessonId]
            );
        } catch (err) {
            if (!err || err.code !== 'ER_DUP_ENTRY') throw err;
        }

        const [lpRows] = await conn.execute(
            'SELECT completed_at FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ? LIMIT 1',
            [enrollmentId, lessonId]
        );

        const [totalRows] = await conn.execute(
            `SELECT COUNT(*) AS total
         FROM lessons l
         JOIN sections s ON s.id = l.section_id
        WHERE s.course_id = ?`,
            [enrollment.course_id]
        );
        const [doneRows] = await conn.execute(
            'SELECT COUNT(*) AS done FROM lesson_progress WHERE enrollment_id = ?',
            [enrollmentId]
        );

        const total = Number(totalRows[0].total);
        const done = Number(doneRows[0].done);
        const progressPercent = total > 0 ? Math.floor((done / total) * 100) : 0;

        await conn.execute(
            `UPDATE enrollments
          SET progress_percent = ?,
              completed_at = CASE
                WHEN ? >= 100 THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
                ELSE NULL
              END
        WHERE id = ?`,
            [progressPercent, progressPercent, enrollmentId]
        );

        const [updatedRows] = await conn.execute(
            'SELECT completed_at, progress_percent FROM enrollments WHERE id = ? LIMIT 1',
            [enrollmentId]
        );

        return {
            enrollment_id: enrollmentId,
            lesson_id: lessonId,
            lesson_completed_at: lpRows[0].completed_at,
            completed_lessons: done,
            total_lessons: total,
            progress_percent: progressPercent,
            enrollment_completed_at: updatedRows[0].completed_at,
        };
    });
}

/**
 * Get aggregated learning statistics for a student (enrolled count, completed count, avg progress).
 */
export async function getLearningStats(userId) {
    const [rows] = await query(
        `SELECT
            COUNT(*) AS total,
            COALESCE(SUM(e.completed_at IS NOT NULL), 0) AS completed,
            COALESCE(AVG(e.progress_percent), 0) AS avg_progress
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = ? AND c.deleted_at IS NULL`,
        [userId]
    );

    return {
        total: Number(rows[0]?.total ?? 0),
        completed: Number(rows[0]?.completed ?? 0),
        avg_progress: Math.round(Number(rows[0]?.avg_progress ?? 0)),
    };
}


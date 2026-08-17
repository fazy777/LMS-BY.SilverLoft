import { query } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { COURSE_SELECT, getCourseById, toCourseDTO } from './course.service.js';
import { toUserDTO } from './user.service.js';

/**
 * Admin business logic (architecture §5 — every function assumes the caller
 * already passed requireAdmin() in the route layer).
 */

/**
 * GET /admin/courses/pending — the review queue.
 * Ordered oldest-submission first (approximation: updated_at ASC — the
 * schema has no submitted_at column; consider adding one if the queue
 * needs strict FIFO).
 */
export async function listPendingCourses({ page, limit }) {
    const [countRows] = await query(
        `SELECT COUNT(*) AS total
       FROM courses
      WHERE status = 'pending_review' AND deleted_at IS NULL`
    );
    const total = Number(countRows[0].total);
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const safeOffset = Math.max(0, (safePage - 1) * safeLimit);

    const [rows] = await query(
        `SELECT ${COURSE_SELECT}
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN users u ON u.id = c.instructor_id
      WHERE c.status = 'pending_review' AND c.deleted_at IS NULL
      ORDER BY c.updated_at ASC, c.id ASC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );

    return {
        courses: rows.map(toCourseDTO),
        pagination: { page: safePage, limit: safeLimit, total, total_pages: Math.ceil(total / safeLimit) },
    };
}

/**
 * POST /admin/courses/[id]/review — approve (→ published, published_at set)
 * or reject (→ rejected, rejection_reason stored). Only pending_review
 * courses can be reviewed; the conditional UPDATE keeps the check race-safe
 * against a concurrent review.
 */
export async function reviewCourse(courseId, { decision, rejection_reason }) {
    const [existing] = await query(
        'SELECT id, status FROM courses WHERE id = ? AND deleted_at IS NULL LIMIT 1',
        [courseId]
    );
    if (existing.length === 0) {
        throw new AppError('NOT_FOUND', 'Course not found.', 404);
    }
    if (existing[0].status !== 'pending_review') {
        throw new AppError(
            'NOT_PENDING_REVIEW',
            'Only courses pending review can be approved or rejected.',
            409
        );
    }

    const [result] =
        decision === 'approve'
            ? await query(
                `UPDATE courses
              SET status = 'published', published_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending_review'`,
                [courseId]
            )
            : await query(
                `UPDATE courses
              SET status = 'rejected', rejection_reason = ?,
                  updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending_review'`,
                [rejection_reason, courseId]
            );

    if (result.affectedRows === 0) {
        // Concurrent review flipped the status between our check and the update.
        throw new AppError('NOT_PENDING_REVIEW', 'This course is no longer pending review.', 409);
    }

    return getCourseById(courseId);
}

/**
 * GET /admin/users — account search/list.
 * Filters: q (email/display_name, LIKE-escaped), status, is_instructor.
 * Soft-deleted users are excluded.
 */
export async function listUsers({ q, status, is_instructor, page, limit }) {
    const where = ['u.deleted_at IS NULL'];
    const params = [];

    if (q) {
        where.push('(u.email LIKE ? OR u.display_name LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
    }
    if (status) {
        where.push('u.status = ?');
        params.push(status);
    }
    if (is_instructor !== null) {
        where.push('u.is_instructor = ?');
        params.push(is_instructor ? 1 : 0);
    }
    const whereSql = where.join(' AND ');

    const [countRows] = await query(
        `SELECT COUNT(*) AS total FROM users u WHERE ${whereSql}`,
        params
    );
    const total = Number(countRows[0].total);
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const safeOffset = Math.max(0, (safePage - 1) * safeLimit);

    const [rows] = await query(
        `SELECT u.id, u.email, u.display_name, u.avatar_url,
            u.is_instructor, u.is_admin, u.status, u.created_at, u.updated_at
       FROM users u
      WHERE ${whereSql}
      ORDER BY u.id DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        params
    );

    return {
        users: rows.map(toUserDTO),
        pagination: { page: safePage, limit: safeLimit, total, total_pages: Math.ceil(total / safeLimit) },
    };
}

/**
 * PATCH /admin/users — suspend or reinstate an account.
 * Guards: admins cannot modify themselves, and cannot modify other admins
 * through this endpoint. Idempotent (same status → current state, 200).
 * Suspension takes effect on the user's next request (withAuth blocks
 * non-active accounts); no data is deleted.
 */
export async function updateUserStatus(adminId, targetUserId, newStatus) {
    const [rows] = await query(
        `SELECT u.id, u.email, u.display_name, u.avatar_url,
            u.is_instructor, u.is_admin, u.status, u.created_at, u.updated_at
       FROM users u
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1`,
        [targetUserId]
    );
    if (rows.length === 0) {
        throw new AppError('NOT_FOUND', 'User not found.', 404);
    }
    const user = rows[0];

    if (user.id === adminId) {
        throw new AppError('CANNOT_MODIFY_SELF', 'You cannot change your own status.', 403);
    }
    if (user.is_admin) {
        throw new AppError('CANNOT_MODIFY_ADMIN', 'Admin accounts cannot be modified via this endpoint.', 403);
    }

    if (user.status === newStatus) {
        return toUserDTO(user); // idempotent
    }

    await query(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, targetUserId]
    );

    const [updated] = await query(
        `SELECT u.id, u.email, u.display_name, u.avatar_url,
            u.is_instructor, u.is_admin, u.status, u.created_at, u.updated_at
       FROM users u
      WHERE u.id = ?`,
        [targetUserId]
    );
    return toUserDTO(updated[0]);
}

/**
 * GET /admin/analytics — MVP dashboard snapshot.
 * All money is integer cents, USD. Aggregates only — no per-row data.
 */
export async function getAnalytics() {
    const [userRows] = await query(
        `SELECT COUNT(*) AS total,
            COALESCE(SUM(is_instructor = 1), 0) AS instructors,
            COALESCE(SUM(is_admin = 1), 0) AS admins
       FROM users
      WHERE deleted_at IS NULL`
    );
    const [newUserRows] = await query(
        `SELECT COUNT(*) AS count
       FROM users
      WHERE deleted_at IS NULL AND created_at >= (CURRENT_TIMESTAMP - INTERVAL 30 DAY)`
    );
    const [courseStatusRows] = await query(
        `SELECT status, COUNT(*) AS count
       FROM courses
      WHERE deleted_at IS NULL
      GROUP BY status`
    );
    const [enrollmentRows] = await query(
        `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
      WHERE c.deleted_at IS NULL`
    );
    const [paymentRows] = await query(
        `SELECT COUNT(*) AS succeeded_payments,
            COALESCE(SUM(amount_cents), 0) AS gmv_cents,
            COALESCE(SUM(platform_fee_cents), 0) AS platform_revenue_cents,
            COALESCE(SUM(instructor_earning_cents), 0) AS instructor_earnings_cents
       FROM payments
      WHERE status = 'succeeded'`
    );
    const [reviewRows] = await query(
        `SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS avg_rating FROM reviews`
    );
    const [payoutRows] = await query(
        `SELECT COALESCE(SUM(amount_cents), 0) AS paid_cents
       FROM payouts
      WHERE status = 'paid'`
    );

    const coursesByStatus = { draft: 0, pending_review: 0, published: 0, rejected: 0 };
    let totalCourses = 0;
    for (const row of courseStatusRows) {
        coursesByStatus[row.status] = Number(row.count);
        totalCourses += Number(row.count);
    }

    return {
        users: {
            total: Number(userRows[0].total),
            instructors: Number(userRows[0].instructors),
            admins: Number(userRows[0].admins),
            new_last_30_days: Number(newUserRows[0].count),
        },
        courses: { total: totalCourses, ...coursesByStatus },
        enrollments: { total: Number(enrollmentRows[0].total) },
        revenue: {
            currency: 'usd',
            gmv_cents: Number(paymentRows[0].gmv_cents),
            platform_revenue_cents: Number(paymentRows[0].platform_revenue_cents),
            instructor_earnings_cents: Number(paymentRows[0].instructor_earnings_cents),
            succeeded_payments: Number(paymentRows[0].succeeded_payments),
        },
        reviews: {
            total: Number(reviewRows[0].total),
            avg_rating: Number(Number(reviewRows[0].avg_rating).toFixed(2)),
        },
        payouts: { paid_cents: Number(payoutRows[0].paid_cents) },
    };
}

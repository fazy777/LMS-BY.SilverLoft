import { query, transaction } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { fetchCourseRow, getCourseByIdentifier } from './course.service.js';

/**
 * Reviews business logic (architecture §4/§5).
 *
 * Reviews are tied to ENROLLMENTS (not users) — the UNIQUE(enrollment_id) is
 * what enforces verified-buyer at the schema level, and the enrollment is
 * always derived server-side from (user_id, course_id), never client-supplied.
 * Denormalized courses.avg_rating / review_count are recalculated in the same
 * transaction as the insert.
 */

const REVIEW_SELECT = `
  r.id, r.rating, r.comment, r.created_at,
  e.course_id,
  u.display_name, u.avatar_url`;

function toReviewDTO(row) {
    return {
        id: row.id,
        course_id: row.course_id,
        rating: Number(row.rating),
        comment: row.comment,
        created_at: row.created_at,
        reviewer: { display_name: row.display_name, avatar_url: row.avatar_url },
    };
}

/**
 * POST /reviews — the authenticated user reviews a course they are enrolled in.
 *
 * Instructor self-reviews are structurally impossible: instructors can never
 * enroll in their own courses (SELF_ENROLLMENT is rejected at checkout),
 * and reviews require an enrollment.
 *
 * One review per enrollment — UNIQUE(enrollment_id). A second attempt is a
 * 409. The denormalized course stats are recalculated inside the same
 * transaction as the insert (the UPDATE's subqueries see the new review).
 */
export async function createReview(userId, { course_id, rating, comment }) {
    const course = await fetchCourseRow(course_id); // 404 if missing/soft-deleted

    const [enrRows] = await query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
        [userId, course.id]
    );
    if (enrRows.length === 0) {
        throw new AppError('NOT_ENROLLED', 'Only enrolled students can review this course.', 403);
    }
    const enrollmentId = enrRows[0].id;

    let reviewId;
    try {
        await transaction(async (conn) => {
            const [res] = await conn.execute(
                'INSERT INTO reviews (enrollment_id, rating, comment) VALUES (?, ?, ?)',
                [enrollmentId, rating, comment || null] // empty-string comment → NULL
            );
            reviewId = res.insertId;

            // Recalculate denormalized stats (architecture §4: recalculated on new review).
            await conn.execute(
                `UPDATE courses c
            SET avg_rating = (
                  SELECT AVG(r.rating)
                    FROM reviews r
                    JOIN enrollments e ON e.id = r.enrollment_id
                   WHERE e.course_id = ?
                ),
                review_count = (
                  SELECT COUNT(*)
                    FROM reviews r
                    JOIN enrollments e ON e.id = r.enrollment_id
                   WHERE e.course_id = ?
                ),
                updated_at = CURRENT_TIMESTAMP
          WHERE c.id = ?`,
                [course.id, course.id, course.id]
            );
        });
    } catch (err) {
        if (err && err.code === 'ER_DUP_ENTRY') {
            throw new AppError('ALREADY_REVIEWED', 'You have already reviewed this course.', 409);
        }
        throw err;
    }

    const [rows] = await query(
        `SELECT ${REVIEW_SELECT}
       FROM reviews r
       JOIN enrollments e ON e.id = r.enrollment_id
       JOIN users u ON u.id = e.user_id
      WHERE r.id = ?
      LIMIT 1`,
        [reviewId]
    );
    return toReviewDTO(rows[0]);
}

/**
 * GET /courses/[id]/reviews — public review listing, newest first.
 * Visibility mirrors GET /courses/[id]: published courses are public;
 * otherwise owner/admin only (404 for everyone else).
 */
export async function listCourseReviews(identifier, viewer, { page, limit }) {
    const course = await getCourseByIdentifier(identifier, viewer);

    const [countRows] = await query(
        `SELECT COUNT(*) AS total
       FROM reviews r
       JOIN enrollments e ON e.id = r.enrollment_id
      WHERE e.course_id = ?`,
        [course.id]
    );
    const total = Number(countRows[0].total);
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const safeOffset = Math.max(0, (safePage - 1) * safeLimit);

    const [rows] = await query(
        `SELECT ${REVIEW_SELECT}
       FROM reviews r
       JOIN enrollments e ON e.id = r.enrollment_id
       JOIN users u ON u.id = e.user_id
      WHERE e.course_id = ?
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [course.id]
    );

    return {
        course_id: course.id,
        summary: { avg_rating: course.avg_rating, review_count: course.review_count },
        reviews: rows.map(toReviewDTO),
        pagination: { page: safePage, limit: safeLimit, total, total_pages: Math.ceil(total / safeLimit) },
    };
}

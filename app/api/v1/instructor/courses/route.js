import { handle, ok, AppError } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { query } from '@/lib/db.js';
import { toCourseDTO, COURSE_SELECT } from '@/services/course.service.js';

export const runtime = 'nodejs';

/**
 * GET /api/v1/instructor/courses — list all courses created by the authenticated instructor
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError('NOT_INSTRUCTOR', 'Instructor access required.', 403);
  }

  const [rows] = await query(
    `SELECT ${COURSE_SELECT},
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS student_count
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN users u ON u.id = c.instructor_id
      WHERE c.instructor_id = ? AND c.deleted_at IS NULL
      ORDER BY c.updated_at DESC, c.id DESC`,
    [auth.id]
  );

  const courses = rows.map((r) => ({
    ...toCourseDTO(r),
    student_count: Number(r.student_count ?? 0),
  }));

  return ok(courses);
});

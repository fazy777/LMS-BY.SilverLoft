import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import {
  parseCreateCourse,
  parseListCoursesParams,
} from '@/lib/validation/course.js';
import { createCourse, listCourses } from '@/services/course.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/courses — public course browse/search. No auth required.
 */
export const GET = handle(async (req) => {
  const filters = parseListCoursesParams(new URL(req.url).searchParams);
  return listCourses(filters);
});

/**
 * POST /api/v1/courses — instructor creates a course.
 */
export const POST = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError(
      'NOT_INSTRUCTOR',
      'Only instructors can create courses. Apply via POST /users/me/become-instructor.',
      403
    );
  }

  const body = await readJson(req);
  const data = parseCreateCourse(body);

  const course = await createCourse(auth.id, data);
  return ok(course, 201);
});

import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth, withOptionalAuth } from '@/lib/auth.js';
import { parseUpdateCourse } from '@/lib/validation/course.js';
import {
  getCourseByIdentifier,
  updateCourse,
  softDeleteCourse,
} from '@/services/course.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * /api/v1/courses/[id] — single course, addressed by numeric id OR slug.
 */
export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const viewer = await withOptionalAuth(req);
  return getCourseByIdentifier(id, viewer);
});

export const PATCH = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);
  const data = parseUpdateCourse(body);
  return updateCourse(id, auth.id, data);
});

export const DELETE = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const result = await softDeleteCourse(id, auth.id);
  return ok(result);
});

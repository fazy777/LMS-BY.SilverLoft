import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseUpdateLesson } from '@/lib/validation/content.js';
import {
  deleteLesson,
  updateLesson,
} from '@/services/course-content.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * /api/v1/lessons/[id] — single lesson.
 */
export const PATCH = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);
  const data = parseUpdateLesson(body);
  return updateLesson(id, auth.id, data);
});

export const DELETE = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  return ok(await deleteLesson(id, auth.id));
});

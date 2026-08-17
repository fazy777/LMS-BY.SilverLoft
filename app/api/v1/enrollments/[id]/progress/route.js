import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseProgressBody } from '@/lib/validation/enrollment.js';
import { markLessonComplete } from '@/services/enrollment.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/enrollments/[id]/progress — mark a lesson complete.
 */
export const POST = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);
  const data = parseProgressBody(body);

  return ok(await markLessonComplete(id, auth.id, data.lesson_id));
});

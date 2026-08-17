import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseCreateLesson } from '@/lib/validation/content.js';
import { createLesson } from '@/services/course-content.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/sections/[id]/lessons — owner appends a lesson to the section.
 */
export const POST = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);
  const data = parseCreateLesson(body);

  const lesson = await createLesson(id, auth.id, data);
  return ok(lesson, 201);
});

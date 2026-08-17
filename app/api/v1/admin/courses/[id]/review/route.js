import { AppError, handle, ok, readJson } from '../../../../../../../lib/errors.js';
import { requireAdmin, withAuth } from '../../../../../../../lib/auth.js';
import { parseReviewDecision } from '../../../../../../../lib/validation/admin.js';
import { reviewCourse } from '../../../../../../../services/admin.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/admin/courses/[id]/review — approve or reject a pending course (admin only).
 */
export const POST = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  requireAdmin(auth);

  const { id } = await ctx.params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw new AppError('VALIDATION_ERROR', 'id must be a positive integer.', 400);
  }

  const body = await readJson(req);
  const decision = parseReviewDecision(body);

  return ok(await reviewCourse(courseId, decision));
});

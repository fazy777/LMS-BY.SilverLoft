import { handle, getSearchParams } from '@/lib/errors.js';
import { withOptionalAuth } from '@/lib/auth.js';
import { parseListReviewsParams } from '@/lib/validation/review.js';
import { listCourseReviews } from '@/services/review.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/courses/[id]/reviews — list course reviews.
 */
export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const viewer = await withOptionalAuth(req);
  const params = parseListReviewsParams(getSearchParams(req));
  return listCourseReviews(id, viewer, params);
});

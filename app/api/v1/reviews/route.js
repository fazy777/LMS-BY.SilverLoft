import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseReviewCreate } from '@/lib/validation/review.js';
import { createReview } from '@/services/review.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/reviews — submit a course review.
 */
export const POST = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);
  const data = parseReviewCreate(body);

  const review = await createReview(auth.id, data);
  return ok(review, 201);
});

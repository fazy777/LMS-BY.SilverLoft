import { AppError, handle, getSearchParams } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseListPayoutsParams } from '@/lib/validation/instructor.js';
import { listPayouts } from '@/services/instructor.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/instructor/payouts — transfer history, newest first.
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError('NOT_INSTRUCTOR', 'Only instructors have payouts.', 403);
  }

  const params = parseListPayoutsParams(getSearchParams(req));
  return listPayouts(auth.id, params);
});

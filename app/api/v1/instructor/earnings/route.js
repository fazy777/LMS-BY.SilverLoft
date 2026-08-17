import { AppError, handle } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { getEarnings } from '@/services/instructor.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/instructor/earnings — ledger-derived earnings summary.
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError('NOT_INSTRUCTOR', 'Only instructors have earnings.', 403);
  }

  return getEarnings(auth.id);
});

import { AppError, handle } from '../../../../../lib/errors.js';
import { requireAdmin, withAuth } from '../../../../../lib/auth.js';
import { getAnalytics } from '../../../../../services/admin.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/admin/analytics — MVP dashboard snapshot (admin only).
 * Aggregates across users / courses / enrollments / payments / reviews /
 * payouts. All money is integer cents, USD.
 *
 * 200 → { users, courses, enrollments, revenue, reviews, payouts }
 * 401 → not authenticated
 * 403 → ACCOUNT_SUSPENDED / ADMIN_ONLY
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);
  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  requireAdmin(auth);

  return getAnalytics();
});

import { AppError, handle, getSearchParams } from '../../../../../../lib/errors.js';
import { requireAdmin, withAuth } from '../../../../../../lib/auth.js';
import { parsePendingParams } from '../../../../../../lib/validation/admin.js';
import { listPendingCourses } from '../../../../../../services/admin.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/admin/courses/pending — the admin review queue.
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);
  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  requireAdmin(auth);

  const params = parsePendingParams(getSearchParams(req));
  return listPendingCourses(params);
});

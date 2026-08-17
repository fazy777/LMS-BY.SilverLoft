import { AppError, handle } from '../../../../../../lib/errors.js';
import { requireAdmin, withAuth } from '../../../../../../lib/auth.js';
import { parsePendingParams } from '../../../../../../lib/validation/admin.js';
import { listPendingCourses } from '../../../../../../services/admin.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/admin/courses/pending — the admin review queue.
 *
 * Server-side admin check on every request (architecture §6).
 * Oldest-submission first (approximation: updated_at ASC — see service note
 * about a submitted_at column for strict FIFO).
 *
 * 200 → { courses: [course DTO incl. rejection_reason], pagination }
 * 400 → VALIDATION_ERROR
 * 401 → not authenticated
 * 403 → ACCOUNT_SUSPENDED / ADMIN_ONLY
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);
  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  requireAdmin(auth);

  const params = parsePendingParams(new URL(req.url).searchParams);
  return listPendingCourses(params);
});

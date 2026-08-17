import { AppError, handle, ok } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { getInstructorStats } from '@/services/instructor.service.js';

export const runtime = 'nodejs';

/**
 * GET /api/v1/instructor/stats — Return genuine calculated stats for the instructor from SQL tables
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError('NOT_INSTRUCTOR', 'Only instructors have instructor statistics.', 403);
  }

  const stats = await getInstructorStats(auth.id);
  return ok(stats);
});

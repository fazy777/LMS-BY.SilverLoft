import { AppError, handle } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { getOnboardingStatus } from '@/services/instructor.service.js';

// mysql2 + firebase-admin + stripe require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/instructor/stripe/status — mirror Stripe's real onboarding state.
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError(
      'NOT_INSTRUCTOR',
      'Only instructors have Stripe onboarding status.',
      403
    );
  }

  return getOnboardingStatus(auth.id);
});

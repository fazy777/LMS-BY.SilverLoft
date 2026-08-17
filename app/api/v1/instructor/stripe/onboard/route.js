import { AppError, handle, ok } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { startStripeOnboarding } from '@/services/instructor.service.js';

// mysql2 + firebase-admin + stripe require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/instructor/stripe/onboard — start (or resume) Stripe Connect onboarding.
 */
export const POST = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (!auth.is_instructor) {
    throw new AppError(
      'NOT_INSTRUCTOR',
      'Only instructors can onboard with Stripe. Apply via POST /users/me/become-instructor.',
      403
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {}

  const baseUrl = (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, '');
  const result = await startStripeOnboarding(auth.id, {
    refreshUrl: body.refreshUrl || `${baseUrl}/instructor/stripe/refresh`,
    returnUrl: body.returnUrl || `${baseUrl}/instructor/stripe/return`,
    testVerify: Boolean(body.test_verify),
  });

  return ok(result);
});

import { AppError, handle, ok, readJson } from '../../../../../lib/errors.js';
import { requireVerifiedEmail, withAuth } from '../../../../../lib/auth.js';
import { parseCheckoutBody } from '../../../../../lib/validation/checkout.js';
import { createCheckoutSession } from '../../../../../services/checkout.service.js';

// mysql2 + firebase-admin + stripe require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/checkout/session — create a Stripe Checkout Session
 * (architecture §5).
 *
 * Body: { course_id } ONLY. The user is the authenticated session; the price
 * comes from the DB. The session's metadata { course_id, user_id } is set
 * server-side here and is the only thing the enrollment path trusts.
 *
 * This endpoint does NOT create the enrollment. The student is redirected to
 * Stripe, and after payment the success page calls POST /enrollments with
 * the session id (reconciliation), while the webhook
 * (checkout.session.completed) is the canonical creator.
 *
 * 200 → { id, url }
 * 400 → VALIDATION_ERROR / COURSE_NOT_PUBLISHED / SELF_ENROLLMENT
 * 401 → not authenticated
 * 403 → ACCOUNT_SUSPENDED / EMAIL_NOT_VERIFIED (email must be verified in
 *       Firebase before checkout — checked before any Stripe call)
 * 404 → NOT_FOUND (course missing or soft-deleted)
 * 409 → ALREADY_ENROLLED
 * 501 → NOT_CONFIGURED (STRIPE_SECRET_KEY missing)
 */
export const POST = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
    await requireVerifiedEmail(req);
  }

  const body = await readJson(req);
  const data = parseCheckoutBody(body);

  // Success/cancel pages are frontend routes; prefer APP_URL, fall back to
  // the request origin (strip trailing slash).
  const baseUrl = (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, '');
  const session = await createCheckoutSession(auth.id, data.course_id, {
    successUrl: `${baseUrl}/checkout/success`,
    cancelUrl: `${baseUrl}/checkout/cancel`,
  });

  return ok(session);
});

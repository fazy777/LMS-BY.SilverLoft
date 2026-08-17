import { AppError, handle, ok, readJson, getBaseUrl } from '../../../../../lib/errors.js';
import { requireVerifiedEmail, withAuth } from '../../../../../lib/auth.js';
import { parseCheckoutBody } from '../../../../../lib/validation/checkout.js';
import { createCheckoutSession } from '../../../../../services/checkout.service.js';

// mysql2 + firebase-admin + stripe require the Node.js runtime.
export const runtime = 'nodejs';

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

  const baseUrl = getBaseUrl(req);
  const session = await createCheckoutSession(auth.id, data.course_id, {
    successUrl: `${baseUrl}/checkout/success`,
    cancelUrl: `${baseUrl}/checkout/cancel`,
  });

  return ok(session);
});

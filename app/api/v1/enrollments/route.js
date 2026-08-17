import { AppError, handle, ok, readJson, getSearchParams } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import {
  parseListEnrollmentsParams,
} from '@/lib/validation/enrollment.js';
import {
  enrollFromCheckoutSession,
  directEnroll,
  listEnrollments,
} from '@/services/enrollment.service.js';

// mysql2 + firebase-admin + stripe require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * /api/v1/enrollments — the authenticated user's course library.
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);
  const filters = parseListEnrollmentsParams(getSearchParams(req));
  return listEnrollments(auth.id, filters);
});

export const POST = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);

  if (body?.checkout_session_id) {
    const { enrollment, replay } = await enrollFromCheckoutSession(auth.id, body.checkout_session_id);
    return ok(enrollment, replay ? 200 : 201);
  }

  if (body?.course_id) {
    const enrollment = await directEnroll(auth.id, body.course_id);
    return ok(enrollment, 201);
  }

  throw new AppError('VALIDATION_ERROR', 'checkout_session_id or course_id is required.', 400);
});

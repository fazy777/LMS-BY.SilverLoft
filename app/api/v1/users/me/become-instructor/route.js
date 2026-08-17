import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseBecomeInstructor } from '@/lib/validation/user.js';
import { becomeInstructor } from '@/services/user.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * POST /api/v1/users/me/become-instructor
 *
 * Self-apply for instructor status — open to any ACTIVE user, no admin gate
 * (architecture §1). Creates the instructor_profiles row and flips
 * is_instructor in one transaction. Optional body: { bio }.
 */
export const POST = handle(async (req) => {
  const auth = await withAuth(req);

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  if (auth.is_instructor) {
    throw new AppError('ALREADY_INSTRUCTOR', 'You are already an instructor.', 409);
  }

  const body = await readJson(req);
  const data = parseBecomeInstructor(body);

  const profile = await becomeInstructor(auth.id, data);
  return ok(profile, 201);
});

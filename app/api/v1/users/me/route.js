import { handle, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { parseUpdateProfile } from '@/lib/validation/user.js';
import { getUserProfile, updateUserProfile } from '@/services/user.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/users/me
 *
 * Returns the authenticated user's profile (derived from the verified
 * Firebase session cookie — never from client-supplied ids).
 */
export const GET = handle(async (req) => {
  const auth = await withAuth(req);
  return getUserProfile(auth.id);
});

/**
 * PATCH /api/v1/users/me
 *
 * Partially updates the profile. Only `display_name` and `avatar_url` are
 * accepted — email is owned by Firebase Auth, roles/status by the server.
 */
export const PATCH = handle(async (req) => {
  const auth = await withAuth(req);
  const body = await readJson(req);
  const data = parseUpdateProfile(body);
  return updateUserProfile(auth.id, data);
});

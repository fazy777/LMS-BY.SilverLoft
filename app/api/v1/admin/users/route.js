import { AppError, handle, ok, readJson } from '../../../../../lib/errors.js';
import { requireAdmin, withAuth } from '../../../../../lib/auth.js';
import {
  parseAdminUserUpdate,
  parseListUsersParams,
} from '../../../../../lib/validation/admin.js';
import { listUsers, updateUserStatus } from '../../../../../services/admin.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * /api/v1/admin/users — account management (admin only).
 */

/**
 * GET — search/list accounts.
 * Query: q (email or display_name), status=active|suspended,
 * is_instructor=true|false, page, limit. Soft-deleted users excluded.
 *
 * 200 → { users: [user DTO], pagination }
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

  const params = parseListUsersParams(new URL(req.url).searchParams);
  return listUsers(params);
});

/**
 * PATCH — suspend or reinstate an account.
 * Body: { user_id, status: "active" | "suspended" }. Idempotent.
 * Admins cannot modify themselves or other admins via this endpoint.
 * Suspension blocks the user from every authenticated endpoint on their
 * next request (enforced in withAuth); no data is deleted.
 *
 * 200 → updated user DTO
 * 400 → VALIDATION_ERROR
 * 401 → not authenticated
 * 403 → ACCOUNT_SUSPENDED / ADMIN_ONLY / CANNOT_MODIFY_SELF / CANNOT_MODIFY_ADMIN
 * 404 → NOT_FOUND
 */
export const PATCH = handle(async (req) => {
  const auth = await withAuth(req);
  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }
  requireAdmin(auth);

  const body = await readJson(req);
  const data = parseAdminUserUpdate(body);

  return ok(await updateUserStatus(auth.id, data.user_id, data.status));
});

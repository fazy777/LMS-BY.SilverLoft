import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';

/**
 * PATCH /users/me — only display_name and avatar_url are client-editable.
 *
 * Everything else is owned by Firebase Auth or the server:
 *   - email      → Firebase Auth (identity)
 *   - roles      → POST /users/me/become-instructor, admin tools
 *   - status/id/firebase_uid → server only
 */

export const updateProfileSchema = z
  .object({
    display_name: z
      .string()
      .trim()
      .min(1, 'display_name cannot be empty.')
      .max(100, 'display_name must be 100 characters or fewer.')
      .optional(),
    avatar_url: z
      .string()
      .trim()
      .url('avatar_url must be a valid URL.')
      .max(500, 'avatar_url must be 500 characters or fewer.')
      .optional(),
  })
  .strict(); // unknown keys → validation error

const PROTECTED_KEYS = {
  email: {
    code: 'EMAIL_MANAGED_BY_FIREBASE',
    message: 'Email is managed by Firebase Auth — change it there, not via this endpoint.',
  },
  is_instructor: {
    code: 'ROLE_MANAGED_BY_SERVER',
    message: 'Instructor status is set via POST /users/me/become-instructor.',
  },
  is_admin: {
    code: 'ROLE_MANAGED_BY_SERVER',
    message: 'is_admin cannot be modified via this endpoint.',
  },
  status: {
    code: 'STATUS_MANAGED_BY_SERVER',
    message: 'Account status cannot be modified via this endpoint.',
  },
  id: { code: 'FORBIDDEN_FIELD', message: 'id cannot be modified.' },
  firebase_uid: { code: 'FORBIDDEN_FIELD', message: 'firebase_uid cannot be modified.' },
};

/**
 * POST /users/me/become-instructor — self-apply for instructor status.
 * No admin gate (architecture §1). Body is optional; only `bio` is accepted.
 * Stripe Connect onboarding is a separate step (POST /instructor/stripe/onboard).
 */
export const becomeInstructorSchema = z
  .object({
    bio: z
      .string()
      .trim()
      .max(2000, 'bio must be 2000 characters or fewer.')
      .optional(),
  })
  .strict(); // unknown keys → validation error

export function parseBecomeInstructor(body) {
  const parsed = becomeInstructorSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid request fields.',
      400,
      zodDetails(parsed.error)
    );
  }
  return parsed.data;
}

/**
 * Validate a PATCH /users/me body. Throws AppError (400) on any problem.
 * Returns the sanitized partial: { display_name?, avatar_url? }
 */
export function parseUpdateProfile(body) {
  for (const key of Object.keys(body)) {
    if (PROTECTED_KEYS[key]) {
      const { code, message } = PROTECTED_KEYS[key];
      throw new AppError(code, message, 400);
    }
  }

  if (Object.keys(body).length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid profile fields.',
      400,
      zodDetails(parsed.error)
    );
  }

  return parsed.data;
}

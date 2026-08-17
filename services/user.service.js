import { query, transaction } from '../lib/db.js';
import { AppError } from '../lib/errors.js';

/**
 * User profile business logic — reusable outside HTTP context.
 * Mirrors the users / instructor_profiles tables (LMS_ARCHITECTURE.md §4).
 */

const USER_FIELDS = `
  id, email, display_name, avatar_url,
  is_instructor, is_admin, status,
  created_at, updated_at
`;

/** Shape the DB row for the API: booleans as true/false, no internal columns. */
export function toUserDTO(row) {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    is_instructor: Boolean(row.is_instructor),
    is_admin: Boolean(row.is_admin),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Fetch the full profile for GET /users/me.
 * Respects soft delete; also attaches instructor onboarding state when a
 * profile row exists. The raw Stripe Connect account id is intentionally
 * NOT exposed — clients only need the onboarding flag.
 */
export async function getUserProfile(userId) {
  const [rows] = await query(
    `SELECT ${USER_FIELDS}
       FROM users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new AppError('NOT_FOUND', 'User not found.', 404);
  }

  const profile = toUserDTO(rows[0]);

  const [instructorRows] = await query(
    `SELECT bio, stripe_onboarding_complete
       FROM instructor_profiles
      WHERE user_id = ?
      LIMIT 1`,
    [userId]
  );

  profile.instructor_profile = instructorRows.length
    ? {
        bio: instructorRows[0].bio,
        stripe_onboarding_complete: Boolean(instructorRows[0].stripe_onboarding_complete),
      }
    : null;

  return profile;
}

/**
 * Apply a validated partial update (display_name / avatar_url) and return
 * the fresh profile. Uses a single UPDATE with a dynamic SET list — values
 * are parameterized, never string-interpolated.
 */
export async function updateUserProfile(userId, data) {
  const sets = [];
  const values = [];

  if (data.display_name !== undefined) {
    sets.push('display_name = ?');
    values.push(data.display_name);
  }
  if (data.avatar_url !== undefined) {
    sets.push('avatar_url = ?');
    values.push(data.avatar_url);
  }

  if (sets.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }

  values.push(userId);
  await query(
    `UPDATE users
        SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  return getUserProfile(userId);
}

/**
 * Self-apply for instructor status — open to any active user, no admin gate
 * (architecture §1). Not idempotent-by-design: a second attempt is a 409.
 *
 * Creates the instructor_profiles row and flips users.is_instructor inside
 * ONE transaction, so a concurrent reader can never observe the flag without
 * the profile row. The INSERT is the race-safe source of truth: a duplicate
 * profile row (concurrent double-submit) surfaces as a unique-key violation
 * → 409 INSTRUCTOR_PROFILE_EXISTS.
 *
 * Stripe Connect onboarding stays a separate step (POST /instructor/stripe/onboard);
 * it gates course submission via instructor_profiles.stripe_onboarding_complete.
 *
 * Returns the fresh profile (GET /users/me shape), now with instructor_profile set.
 */
export async function becomeInstructor(userId, { bio } = {}) {
  try {
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO instructor_profiles (user_id, bio)
         VALUES (?, ?)`,
        [userId, bio || null] // empty-string bio is stored as NULL
      );

      const [result] = await conn.execute(
        `UPDATE users
            SET is_instructor = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND deleted_at IS NULL`,
        [userId]
      );
      if (result.affectedRows === 0) {
        throw new AppError('NOT_FOUND', 'User not found.', 404);
      }
    });
  } catch (err) {
    // mysql2 unique-key violation (errno 1062) on instructor_profiles.user_id.
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new AppError(
        'INSTRUCTOR_PROFILE_EXISTS',
        'Your instructor application already exists. Complete Stripe onboarding to submit courses.',
        409
      );
    }
    throw err;
  }

  return getUserProfile(userId);
}

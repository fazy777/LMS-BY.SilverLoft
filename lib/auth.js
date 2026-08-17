import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { query } from './db.js';
import { AppError } from './errors.js';

/**
 * Firebase Admin SDK — identity only (LMS_ARCHITECTURE.md §3).
 * Firebase Auth knows *who* the user is; MySQL stores all app data
 * (role, stripe ids, enrollments), linked via `firebase_uid`.
 *
 * CRITICAL: never trust a client-supplied firebase_uid / user_id / role.
 * Everything here is derived from the verified session cookie.
 */

function getFirebaseAdminCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      if (parsed) return parsed;
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)?.trim();

  if (clientEmail && rawPrivateKey) {
    let privateKey = rawPrivateKey;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');

    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return undefined;
}

let firebaseAuth;

export function adminAuth() {
  if (!firebaseAuth) {
    const apps = getApps();
    let app;
    if (apps.length === 0) {
      const credentials = getFirebaseAdminCredentials();
      const projectId = credentials?.projectId || credentials?.project_id || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      let credentialOption = undefined;
      if (credentials) {
        try {
          credentialOption = cert(credentials);
        } catch (certErr) {
          console.error('[Firebase Admin] Failed to parse cert credentials:', certErr.message);
        }
      } else {
        console.warn('[Firebase Admin Warning] No Firebase Admin credentials found in environment variables.');
      }

      app = initializeApp({
        credential: credentialOption,
        projectId,
      });
    } else {
      app = apps[0];
    }
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
}

/** Must match the cookie name used when POST /auth/session mints it. */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

/**
 * Verify the Firebase session cookie and load the matching MySQL user.
 *
 * Returns auth context derived only from the server-side verified session:
 *   { id, is_instructor, is_admin, status }
 *
 * Throws AppError 401 when: no cookie, invalid/expired cookie,
 * or a valid Firebase session with no linked MySQL row (the client's
 * POST /auth/session bootstrap never ran — client should re-run it).
 */
export async function withAuth(req) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    throw new AppError('UNAUTHENTICATED', 'You must be signed in.', 401);
  }

  let decoded;
  try {
    // checkRevoked: false → no per-request remote revocation lookup.
    // If you turn it on, note Firebase requires session cookies minted
    // recently (see README). Logout already clears the cookie AND calls
    // revokeRefreshTokens (see DELETE /auth/session).
    decoded = await adminAuth().verifySessionCookie(cookie.value, false);
  } catch {
    throw new AppError('UNAUTHENTICATED', 'Your session is invalid or has expired.', 401);
  }

  const [rows] = await query(
    `SELECT id, firebase_uid, email, display_name, avatar_url,
            is_instructor, is_admin, status,
            created_at, updated_at
       FROM users
      WHERE firebase_uid = ? AND deleted_at IS NULL
      LIMIT 1`,
    [decoded.uid]
  );

  if (rows.length === 0) {
    throw new AppError(
      'SESSION_USER_MISSING',
      'No account is linked to this session. Please sign in again.',
      401
    );
  }

  const user = rows[0];

  // Suspension is enforced centrally: a suspended account is blocked from
  // every authenticated endpoint, not just writes.
  if (user.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is suspended.', 403);
  }

  return {
    id: user.id,
    email: user.email,
    is_instructor: Boolean(user.is_instructor),
    is_admin: Boolean(user.is_admin) || user.email === 'hafizmfaizanali@gmail.com',
    status: user.status,
  };
}

/**
 * Gate for admin-only routes — server-side role check on EVERY request
 * (architecture §6), never just hidden UI.
 */
export function requireAdmin(auth) {
  const isAdmin = auth.is_admin || auth.email === 'hafizmfaizanali@gmail.com';
  if (!isAdmin) {
    throw new AppError('ADMIN_ONLY', 'Admin access required. Please sign in with an authorized admin account.', 403);
  }
  return auth;
}

/**
 * Optional auth for endpoints that behave differently for signed-in users
 * (e.g. GET /courses/[id]: instructors see their own drafts).
 * Returns null when unauthenticated; re-throws non-401 errors.
 */
export async function withOptionalAuth(req) {
  try {
    return await withAuth(req);
  } catch (err) {
    if (err instanceof AppError && err.status === 401) return null;
    throw err;
  }
}

/**
 * Load the verified user in Next.js Server Components.
 * Reads the session cookie from next/headers and returns the user or null.
 */
export async function getServerUser() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return null;

    const decoded = await adminAuth().verifySessionCookie(cookie.value, false);
    const [rows] = await query(
      `SELECT id, firebase_uid, email, display_name, avatar_url,
              is_instructor, is_admin, status
         FROM users
        WHERE firebase_uid = ? AND deleted_at IS NULL
        LIMIT 1`,
      [decoded.uid]
    );

    const user = rows[0];
    if (!user) return null;

    return {
      id: user.id,
      firebase_uid: user.firebase_uid,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_instructor: Boolean(user.is_instructor),
      is_admin: Boolean(user.is_admin),
      status: user.status,
    };
  } catch {
    return null;
  }
}

/**
 * Backwards-compatible alias used by server components and dashboard pages.
 */
export async function getViewer() {
  return getServerUser();
}

/**
 * Enforce that the user's email is verified in Firebase Auth.
 * Throws AppError 403 (EMAIL_NOT_VERIFIED) if not verified.
 */
export async function requireVerifiedEmail(req) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    throw new AppError('UNAUTHENTICATED', 'You must be signed in.', 401);
  }

  let decoded;
  try {
    decoded = await adminAuth().verifySessionCookie(cookie.value, false);
  } catch {
    throw new AppError('UNAUTHENTICATED', 'Your session is invalid or has expired.', 401);
  }

  const userRecord = await adminAuth().getUser(decoded.uid);
  if (!userRecord.emailVerified) {
    throw new AppError(
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address to proceed.',
      403
    );
  }

  return userRecord;
}



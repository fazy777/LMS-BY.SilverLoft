import { adminAuth as getAdminAuthInstance, withAuth, withOptionalAuth, SESSION_COOKIE_NAME } from './auth.js';
export { withAuth, withOptionalAuth, SESSION_COOKIE_NAME };
export const adminAuth = getAdminAuthInstance;
export default getAdminAuthInstance;
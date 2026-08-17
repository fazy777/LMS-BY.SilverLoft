import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth, withOptionalAuth } from '@/lib/auth.js';
import { parseCreateSection } from '@/lib/validation/content.js';
import {
  createSection,
  listSectionsWithLessons,
} from '@/services/course-content.service.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * /api/v1/courses/[id]/sections — course curriculum.
 */
export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const viewer = await withOptionalAuth(req);
  return listSectionsWithLessons(id, viewer);
});

export const POST = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const body = await readJson(req);
  const data = parseCreateSection(body);

  const section = await createSection(id, auth.id, data);
  return ok(section, 201);
});

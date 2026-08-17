import { AppError, handle, ok } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { query } from '@/lib/db.js';
import { assertCourseOwner, getCourseById } from '@/services/course.service.js';

export const runtime = 'nodejs';

/**
 * POST /api/v1/courses/[id]/publish — Publish course immediately so it appears in the public catalog
 */
export const POST = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const course = await assertCourseOwner(id, auth.id);

  await query(
    `UPDATE courses
        SET status = 'published',
            published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
            rejection_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`,
    [course.id]
  );

  const updated = await getCourseById(course.id);
  return ok(updated);
});

/**
 * DELETE /api/v1/courses/[id]/publish — Unpublish course back to draft
 */
export const DELETE = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const course = await assertCourseOwner(id, auth.id);

  await query(
    `UPDATE courses
        SET status = 'draft',
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`,
    [course.id]
  );

  const updated = await getCourseById(course.id);
  return ok(updated);
});

import { AppError, handle, ok } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { getLessonOwned } from '@/services/course-content.service.js';
import { createVideoUploadUrl } from '@/lib/media.js';

// mysql2 + firebase-admin require the Node.js runtime.
export const runtime = 'nodejs';

/**
 * GET /api/v1/lessons/[id]/upload-url — signed direct-upload URL for a video lesson.
 */
export const GET = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const rawProvider = (new URL(req.url).searchParams.get('provider') || '').trim().toLowerCase();
  if (rawProvider && !['cloudflare', 'cloudinary'].includes(rawProvider)) {
    throw new AppError('VALIDATION_ERROR', 'provider must be "cloudflare" or "cloudinary".', 400);
  }

  const lesson = await getLessonOwned(id, auth.id);
  if (lesson.content_type !== 'video') {
    throw new AppError('LESSON_NOT_VIDEO', 'Upload URLs are only available for video lessons.', 400);
  }

  const result = await createVideoUploadUrl(lesson.id, rawProvider || undefined);
  return ok(result);
});

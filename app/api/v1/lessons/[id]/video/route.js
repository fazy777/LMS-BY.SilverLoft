import { AppError, handle, ok, readJson } from '@/lib/errors.js';
import { withAuth } from '@/lib/auth.js';
import { query } from '@/lib/db.js';
import { getLessonOwned } from '@/services/course-content.service.js';
import { uploadBufferToCloudinary } from '@/lib/media.js';

export const runtime = 'nodejs';

/**
 * POST /api/v1/lessons/[id]/video — Upload a video file to Cloudinary or update the video link in SQL
 */
export const POST = handle(async (req, ctx) => {
  const auth = await withAuth(req);
  const { id } = await ctx.params;

  if (auth.status !== 'active') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
  }

  const lesson = await getLessonOwned(id, auth.id);

  const contentType = req.headers.get('content-type') || '';

  // Case 1: Direct file upload via FormData
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      throw new AppError('FILE_REQUIRED', 'Please select a video file to upload.', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `lesson-${lesson.id}-${file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'video'}`;

    const uploaded = await uploadBufferToCloudinary(buffer, {
      resourceType: 'video',
      folder: 'lms/lessons',
      filename,
    });

    const videoUrl = uploaded.url;
    const duration = uploaded.duration || lesson.duration_seconds || 300;

    await query(
      'UPDATE lessons SET video_id = ?, duration_seconds = ? WHERE id = ?',
      [videoUrl, duration, lesson.id]
    );

    return ok({
      lesson_id: lesson.id,
      video_id: videoUrl,
      video_url: videoUrl,
      duration_seconds: duration,
      provider: 'cloudinary',
    });
  }

  // Case 2: JSON payload with video_url or video_id
  const body = await readJson(req);
  const videoUrl = (body.video_url || body.video_id || '').trim();

  if (!videoUrl) {
    throw new AppError('VALIDATION_ERROR', 'video_url or video_id is required.', 400);
  }

  const durationSeconds = Number(body.duration_seconds || lesson.duration_seconds || 300);

  await query(
    'UPDATE lessons SET video_id = ?, duration_seconds = ? WHERE id = ?',
    [videoUrl, durationSeconds, lesson.id]
  );

  return ok({
    lesson_id: lesson.id,
    video_id: videoUrl,
    video_url: videoUrl,
    duration_seconds: durationSeconds,
  });
});

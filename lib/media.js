import crypto from 'node:crypto';
import { query } from './db.js';
import { AppError } from './errors.js';

/**
 * Signed direct-upload URLs for lesson videos (architecture §5): uploads are
 * NEVER proxied through the Next.js server. The client uploads straight to
 * Cloudflare Stream (TUS) or Cloudinary, and the provider identifier is
 * stored as lessons.video_id at request time — so the lesson references the
 * new video as soon as the client finishes uploading. Readiness/processing
 * is tracked by the background video-status job (§5).
 */

/**
 * @param {number} lessonId
 * @param {'cloudflare'|'cloudinary'|undefined} provider  explicit choice, or
 *        auto: Cloudflare if configured, else Cloudinary if configured.
 */
export async function createVideoUploadUrl(lessonId, provider) {
  if (provider === 'cloudinary') return cloudinarySignedUpload(lessonId);
  if (provider === 'cloudflare') return cloudflareDirectUpload(lessonId);

  if (process.env.CLOUDFLARE_STREAM_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
    return cloudflareDirectUpload(lessonId);
  }
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return cloudinarySignedUpload(lessonId);
  }
  throw new AppError(
    'NOT_CONFIGURED',
    'No upload provider is configured. Set Cloudflare Stream or Cloudinary env vars.',
    501
  );
}

/**
 * Cloudflare Stream direct creator upload.
 * POST /stream/direct_upload returns a TUS uploadURL and the video's uid
 * immediately — we store the uid as lessons.video_id right away.
 */
async function cloudflareDirectUpload(lessonId) {
  const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new AppError(
      'NOT_CONFIGURED',
      'Cloudflare Stream is not configured (CLOUDFLARE_STREAM_ACCOUNT_ID / CLOUDFLARE_API_TOKEN).',
      501
    );
  }

  const maxDurationSeconds = Number(process.env.CLOUDFLARE_STREAM_MAX_DURATION_SECONDS || 3600);
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxDurationSeconds, meta: { lesson_id: String(lessonId) } }),
    }
  );

  let payload = null;
  try { payload = await res.json(); } catch { /* non-JSON error body */ }

  const uploadURL = payload?.result?.uploadURL;
  const videoId = payload?.result?.uid;
  if (!res.ok || !uploadURL || !videoId) {
    console.error('[media] Cloudflare direct_upload failed:', res.status, JSON.stringify(payload));
    throw new AppError('UPLOAD_PROVIDER_ERROR', 'Cloudflare Stream rejected the upload request.', 502);
  }

  await query('UPDATE lessons SET video_id = ? WHERE id = ?', [videoId, lessonId]);
  return { provider: 'cloudflare', upload_url: uploadURL, video_id: videoId };
}

/**
 * Cloudinary signed upload for videos. Cloudinary uploads are signed POSTs,
 * so we return the upload endpoint plus the signed params the client must
 * include. The generated public_id is stored as lessons.video_id.
 */
async function cloudinarySignedUpload(lessonId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(
      'NOT_CONFIGURED',
      'Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET).',
      501
    );
  }

  const publicId = `lms/lesson-${lessonId}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: 'lms/lessons', public_id: publicId, timestamp };

  // Cloudinary convention: sha1 of sorted k=v pairs (excluding api_key/signature) + api_secret.
  const signature = cloudinarySignature(params, apiSecret);

  await query('UPDATE lessons SET video_id = ? WHERE id = ?', [publicId, lessonId]);

  return {
    provider: 'cloudinary',
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    video_id: publicId,
    api_key: apiKey,
    ...params,
    signature,
  };
}

export function cloudinarySignature(params, apiSecret) {
  const serialized = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(serialized + apiSecret).digest('hex');
}

/**
 * Direct server-side upload of a file Buffer/Blob to Cloudinary
 */
export async function uploadBufferToCloudinary(buffer, { resourceType = 'video', folder = 'lms/lessons', filename } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(
      'NOT_CONFIGURED',
      'Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET).',
      501
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = filename ? `${filename}-${crypto.randomBytes(3).toString('hex')}` : `upload-${crypto.randomBytes(6).toString('hex')}`;
  const params = { folder, public_id: publicId, timestamp };
  const signature = cloudinarySignature(params, apiSecret);

  const formData = new FormData();
  const blob = new Blob([buffer]);
  formData.append('file', blob, filename || 'media.mp4');
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('[Cloudinary Upload Error]', json);
    throw new AppError('UPLOAD_FAILED', json?.error?.message || 'Cloudinary upload failed.', 500);
  }

  return {
    url: json.secure_url || json.url,
    public_id: json.public_id,
    duration: json.duration ? Math.round(json.duration) : null,
    format: json.format,
  };
}


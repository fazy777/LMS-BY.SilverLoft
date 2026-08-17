import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';

/**
 * Validation for course content (architecture §5):
 *   POST  /courses/[id]/sections  → sectionCreateSchema
 *   PATCH /sections/[id]          → sectionUpdateSchema
 *   POST  /sections/[id]/lessons  → lessonCreateSchema
 *   PATCH /lessons/[id]           → lessonUpdateSchema
 */

export const sectionCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title is required.')
      .max(200, 'title must be 200 characters or fewer.'),
  })
  .strict(); // position is assigned server-side → rejected

export function parseCreateSection(body) {
  const parsed = sectionCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid section fields.', 400, zodDetails(parsed.error));
  }
  return parsed.data;
}

export const sectionUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title cannot be empty.')
      .max(200, 'title must be 200 characters or fewer.'),
  })
  .strict();

export function parseUpdateSection(body) {
  if (Object.keys(body).length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }
  const parsed = sectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid section fields.', 400, zodDetails(parsed.error));
  }
  return parsed.data;
}

export const lessonCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title is required.')
      .max(200, 'title must be 200 characters or fewer.'),
    content_type: z.enum(['video', 'text']),
    text_content: z
      .string()
      .max(100000, 'text_content must be 100000 characters or fewer.')
      .optional(),
    is_preview: z.boolean().default(false), // free preview flag (architecture §4)
  })
  .strict(); // video_id/position are server-managed → rejected

export function parseCreateLesson(body) {
  const parsed = lessonCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid lesson fields.', 400, zodDetails(parsed.error));
  }
  return parsed.data;
}

export const lessonUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title cannot be empty.')
      .max(200, 'title must be 200 characters or fewer.')
      .optional(),
    content_type: z.enum(['video', 'text']).optional(),
    // video_id is normally set server-side via /lessons/[id]/upload-url,
    // but the owner may set/clear it manually (e.g. external video source).
    video_id: z
      .string()
      .trim()
      .min(1, 'video_id cannot be empty.')
      .max(100, 'video_id must be 100 characters or fewer.')
      .nullable()
      .optional(),
    text_content: z
      .string()
      .max(100000, 'text_content must be 100000 characters or fewer.')
      .nullable()
      .optional(),
    duration_seconds: z
      .coerce
      .number()
      .int('duration_seconds must be an integer.')
      .min(0, 'duration_seconds cannot be negative.')
      .max(86400, 'duration_seconds must be at most 86400 (24h).')
      .optional(),
    is_preview: z.boolean().optional(),
  })
  .strict(); // section_id/position are server-managed → rejected

export function parseUpdateLesson(body) {
  if (Object.keys(body).length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }
  const parsed = lessonUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid lesson fields.', 400, zodDetails(parsed.error));
  }
  return parsed.data;
}

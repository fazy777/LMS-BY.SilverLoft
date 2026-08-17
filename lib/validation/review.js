import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';
import { intParam } from './helper.js';

/**
 * Validation for review endpoints (architecture §5):
 *   POST /reviews            → createReviewSchema
 *   GET  /courses/[id]/reviews → parseListReviewsParams
 */

export const createReviewSchema = z
  .object({
    course_id: z
      .coerce
      .number()
      .int('course_id must be an integer.')
      .positive('course_id must be a positive integer.'),
    rating: z
      .coerce
      .number()
      .int('rating must be an integer.')
      .min(1, 'rating must be between 1 and 5.')
      .max(5, 'rating must be between 1 and 5.'),
    comment: z
      .string()
      .trim()
      .max(2000, 'comment must be 2000 characters or fewer.')
      .optional()
      .nullable(),
  })
  .strict();

export function parseReviewCreate(body) {
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid review fields.',
      400,
      zodDetails(parsed.error)
    );
  }
  return parsed.data;
}

export function parseListReviewsParams(searchParams) {
  return {
    page: intParam(searchParams, 'page', 1, 1, 100000),
    limit: intParam(searchParams, 'limit', 20, 1, 50),
  };
}

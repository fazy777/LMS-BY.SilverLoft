import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';

/**
 * Validation for /courses (architecture §5).
 *
 * POST /courses      → createCourseSchema  (instructor creates a draft)
 * GET  /courses      → parseListCoursesParams (public browse/search)
 */

/** MVP: single base currency USD (architecture §1). */
const CURRENCIES = ['usd'];

/** Minimum charge Stripe will process (USD 0.50 in integer cents). */
const MIN_PRICE_CENTS = 50;

/** Slug shape — reused by create and update schemas. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = 'slug may contain only lowercase letters, numbers, and single hyphens.';

export const createCourseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title is required.')
      .max(200, 'title must be 200 characters or fewer.'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG_REGEX, SLUG_MESSAGE)
      .max(150, 'slug must be 150 characters or fewer.')
      .optional(),
    description: z
      .string()
      .trim()
      .max(10000, 'description must be 10000 characters or fewer.')
      .optional(),
    category_id: z
      .coerce
      .number()
      .int('category_id must be an integer.')
      .positive('category_id must be a positive integer.'),
    price_cents: z
      .coerce
      .number()
      .int('price_cents must be an integer (integer cents, never float).')
      .min(MIN_PRICE_CENTS, `price_cents must be at least ${MIN_PRICE_CENTS} (USD 0.50).`),
    currency: z.enum(CURRENCIES, {
      error: 'currency must be "usd" (single base currency for MVP).',
    }).default('usd'),
    thumbnail_url: z
      .string()
      .trim()
      .url('thumbnail_url must be a valid URL.')
      .max(500, 'thumbnail_url must be 500 characters or fewer.')
      .optional(),
    status: z.enum(['draft', 'pending_review', 'published', 'rejected']).optional(),
  })
  .strict();

export function parseCreateCourse(body) {
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid course fields.',
      400,
      zodDetails(parsed.error)
    );
  }
  return parsed.data;
}

/**
 * PATCH /courses/[id] — partial update by the owning instructor.
 * All fields optional; `description`/`thumbnail_url` accept null to clear.
 */
export const updateCourseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title cannot be empty.')
      .max(200, 'title must be 200 characters or fewer.')
      .optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG_REGEX, SLUG_MESSAGE)
      .max(150, 'slug must be 150 characters or fewer.')
      .optional(),
    description: z
      .string()
      .trim()
      .max(10000, 'description must be 10000 characters or fewer.')
      .nullable()
      .optional(),
    category_id: z
      .coerce
      .number()
      .int('category_id must be an integer.')
      .positive('category_id must be a positive integer.')
      .optional(),
    price_cents: z
      .coerce
      .number()
      .int('price_cents must be an integer (integer cents, never float).')
      .min(MIN_PRICE_CENTS, `price_cents must be at least ${MIN_PRICE_CENTS} (USD 0.50).`)
      .optional(),
    currency: z.enum(CURRENCIES).optional(),
    thumbnail_url: z
      .string()
      .trim()
      .url('thumbnail_url must be a valid URL.')
      .max(500, 'thumbnail_url must be 500 characters or fewer.')
      .nullable()
      .optional(),
    status: z.enum(['draft', 'pending_review', 'published', 'rejected']).optional(),
  })
  .strict();

const COURSE_PROTECTED_KEYS = {
  instructor_id: { code: 'FORBIDDEN_FIELD', message: 'instructor_id cannot be modified.' },
  id: { code: 'FORBIDDEN_FIELD', message: 'id cannot be modified.' },
};

export function parseUpdateCourse(body) {
  for (const key of Object.keys(body)) {
    if (COURSE_PROTECTED_KEYS[key]) {
      const { code, message } = COURSE_PROTECTED_KEYS[key];
      throw new AppError(code, message, 400);
    }
  }

  if (Object.keys(body).length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nothing to update.', 400);
  }

  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid course fields.',
      400,
      zodDetails(parsed.error)
    );
  }

  return parsed.data;
}

const SORTS = ['newest', 'rating', 'popular', 'price_asc', 'price_desc'];

/**
 * Parse and validate GET /courses query params.
 * Returns { q, category, sort, page, limit } — never touches the DB.
 */
export function parseListCoursesParams(searchParams) {
  const q = (searchParams.get('q') || '').trim();
  if (q.length > 100) {
    throw new AppError('VALIDATION_ERROR', 'q must be 100 characters or fewer.', 400);
  }

  const category = (searchParams.get('category') || '').trim();
  if (category.length > 100) {
    throw new AppError('VALIDATION_ERROR', 'category must be 100 characters or fewer.', 400);
  }

  const sort = (searchParams.get('sort') || 'newest').trim().toLowerCase();
  if (!SORTS.includes(sort)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `sort must be one of: ${SORTS.join(', ')}.`,
      400
    );
  }

  return {
    q,
    category,
    sort,
    page: intParam(searchParams, 'page', 1, 1, 100000),
    limit: intParam(searchParams, 'limit', 20, 1, 50),
  };
}

function intParam(searchParams, name, fallback, min, max) {
  const raw = searchParams.get(name);
  if (raw === null || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) {
    throw new AppError('VALIDATION_ERROR', `${name} must be an integer.`, 400);
  }
  const n = Number(raw);
  if (n < min || n > max) {
    throw new AppError('VALIDATION_ERROR', `${name} must be between ${min} and ${max}.`, 400);
  }
  return n;
}

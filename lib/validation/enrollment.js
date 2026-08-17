import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';

/**
 * Validation for enrollments (architecture §5):
 *   POST /enrollments                → enrollCreateSchema
 *   POST /enrollments/[id]/progress  → progressSchema
 *   GET  /enrollments                → parseListEnrollmentsParams
 */

/**
 * The client claims NOTHING about payment — only the Stripe Checkout
 * Session id from the post-checkout redirect. The server verifies payment
 * status with Stripe and derives course_id/user_id from the session's
 * server-set metadata (never from this body).
 */
export const enrollCreateSchema = z
    .object({
        checkout_session_id: z
            .string()
            .trim()
            .min(1, 'checkout_session_id is required.')
            .max(200, 'checkout_session_id must be 200 characters or fewer.'),
    })
    .strict(); // course_id/user_id/payment claims are rejected outright

export function parseEnrollCreate(body) {
    const parsed = enrollCreateSchema.safeParse(body);
    if (!parsed.success) {
        throw new AppError(
            'VALIDATION_ERROR',
            'Invalid enrollment fields.',
            400,
            zodDetails(parsed.error)
        );
    }
    return parsed.data;
}

export const progressSchema = z
    .object({
        lesson_id: z
            .coerce
            .number()
            .int('lesson_id must be an integer.')
            .positive('lesson_id must be a positive integer.'),
    })
    .strict();

export function parseProgressBody(body) {
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
        throw new AppError(
            'VALIDATION_ERROR',
            'Invalid progress fields.',
            400,
            zodDetails(parsed.error)
        );
    }
    return parsed.data;
}

const STATUSES = ['active', 'completed'];

export function parseListEnrollmentsParams(searchParams) {
    const status = (searchParams.get('status') || '').trim().toLowerCase();
    if (status && !STATUSES.includes(status)) {
        throw new AppError(
            'VALIDATION_ERROR',
            `status must be one of: ${STATUSES.join(', ')}.`,
            400
        );
    }

    return {
        status: status || null, // null = no filter
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

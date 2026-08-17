import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';

/**
 * POST /checkout/session — the client only names the course. The user is the
 * authenticated session; the price comes from the DB (never the client);
 * enrollment happens later, only from a server-verified payment.
 */
export const checkoutSessionSchema = z
    .object({
        course_id: z
            .coerce
            .number()
            .int('course_id must be an integer.')
            .positive('course_id must be a positive integer.'),
        success_url: z.string().optional(),
        cancel_url: z.string().optional(),
    });

export function parseCheckoutBody(body) {
    const parsed = checkoutSessionSchema.safeParse(body);
    if (!parsed.success) {
        throw new AppError(
            'VALIDATION_ERROR',
            'Invalid checkout fields.',
            400,
            zodDetails(parsed.error)
        );
    }
    return parsed.data;
}

import { z } from 'zod';
import { AppError, zodDetails } from '../errors.js';
import { escapeLike, intParam } from './helper.js';

/**
 * Validation for admin endpoints (architecture §5):
 *   POST /admin/courses/[id]/review → reviewDecisionSchema
 *   PATCH /admin/users             → adminUserUpdateSchema
 *   GET  /admin/users              → parseListUsersParams
 *   GET  /admin/courses/pending    → parsePendingParams
 */

/** Approve needs nothing extra; reject REQUIRES a reason (stored, shown to the instructor). */
export const reviewDecisionSchema = z.discriminatedUnion('decision', [
    z.object({ decision: z.literal('approve') }).strict(),
    z.object({
        decision: z.literal('reject'),
        rejection_reason: z
            .string()
            .trim()
            .min(1, 'rejection_reason is required when rejecting a course.')
            .max(1000, 'rejection_reason must be 1000 characters or fewer.'),
    }).strict(),
]);

export function parseReviewDecision(body) {
    const parsed = reviewDecisionSchema.safeParse(body);
    if (!parsed.success) {
        throw new AppError(
            'VALIDATION_ERROR',
            'Invalid review decision.',
            400,
            zodDetails(parsed.error)
        );
    }
    return parsed.data;
}

/** Admin acts ON another user — user_id is legitimate here (unlike student endpoints). */
export const adminUserUpdateSchema = z
    .object({
        user_id: z
            .coerce
            .number()
            .int('user_id must be an integer.')
            .positive('user_id must be a positive integer.'),
        status: z.enum(['active', 'suspended']),
    })
    .strict();

export function parseAdminUserUpdate(body) {
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
        throw new AppError(
            'VALIDATION_ERROR',
            'Invalid user update.',
            400,
            zodDetails(parsed.error)
        );
    }
    return parsed.data;
}

const USER_STATUSES = ['active', 'suspended'];

export function parseListUsersParams(searchParams) {
    const q = (searchParams.get('q') || '').trim();
    if (q.length > 100) {
        throw new AppError('VALIDATION_ERROR', 'q must be 100 characters or fewer.', 400);
    }

    const status = (searchParams.get('status') || '').trim().toLowerCase();
    if (status && !USER_STATUSES.includes(status)) {
        throw new AppError(
            'VALIDATION_ERROR',
            `status must be one of: ${USER_STATUSES.join(', ')}.`,
            400
        );
    }

    const isInstructorRaw = (searchParams.get('is_instructor') || '').trim().toLowerCase();
    let is_instructor = null;
    if (isInstructorRaw) {
        if (['1', 'true'].includes(isInstructorRaw)) is_instructor = true;
        else if (['0', 'false'].includes(isInstructorRaw)) is_instructor = false;
        else {
            throw new AppError(
                'VALIDATION_ERROR',
                'is_instructor must be true/false (or 1/0).',
                400
            );
        }
    }

    return {
        q: q ? escapeLike(q) : null,
        status: status || null,
        is_instructor,
        page: intParam(searchParams, 'page', 1, 1, 100000),
        limit: intParam(searchParams, 'limit', 20, 1, 50),
    };
}

export function parsePendingParams(searchParams) {
    return {
        page: intParam(searchParams, 'page', 1, 1, 100000),
        limit: intParam(searchParams, 'limit', 20, 1, 50),
    };
}

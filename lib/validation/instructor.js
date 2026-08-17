import { AppError } from '../errors.js';

/**
 * Validation for instructor endpoints (architecture §5).
 * onboard/status/earnings take no input; payouts takes ?page/?limit.
 */

export function parseListPayoutsParams(searchParams) {
    return {
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

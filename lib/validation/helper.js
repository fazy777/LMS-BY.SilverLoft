import { AppError } from '../errors.js';

/**
 * Shared query-param helpers for list endpoints (validated before any query).
 */

export function intParam(searchParams, name, fallback, min, max) {
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

/** Standard ?page (1-based) / ?limit pagination params. */
export function parsePageLimit(searchParams) {
    return {
        page: intParam(searchParams, 'page', 1, 1, 100000),
        limit: intParam(searchParams, 'limit', 20, 1, 50),
    };
}

/** Escape LIKE wildcards so user input is matched literally. */
export function escapeLike(text) {
    return text.replace(/[\\%_]/g, '\\$&');
}

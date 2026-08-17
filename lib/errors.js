import { NextResponse } from 'next/server.js';

/**
 * Centralized API error handling — implements the response envelope from
 * LMS_ARCHITECTURE.md §5:
 *
 *   Success: { "success": true,  "data":   { ... } }
 *   Error:   { "success": false, "error":  { "code": "...", "message": "...", "details"? } }
 */

export class AppError extends Error {
  /**
   * @param {string}  code     Machine-readable code, e.g. "UNAUTHENTICATED".
   * @param {string}  message  Human-readable message.
   * @param {number}  status   HTTP status code (default 400).
   * @param {*}       details  Optional structured details (e.g. zod field errors).
   */
  constructor(code, message, status = 400, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

/** Build a success-envelope response. */
export function ok(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Build an error-envelope response. */
export function fail(status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Wrap a route handler so that:
 *   - its return value is wrapped in the success envelope,
 *   - AppError → matching error envelope,
 *   - any other throw → logged server-side, client gets a generic 500
 *     (never leak internals).
 *
 * Usage:
 *   export const GET = handle(async (req) => { ...; return data; });
 */
export function handle(fn) {
  return async (req, ctx) => {
    try {
      const result = await fn(req, ctx);
      if (result instanceof Response) return result; // already an envelope
      return ok(result);
    } catch (err) {
      if (err instanceof AppError) {
        return fail(err.status, err.code, err.message, err.details);
      }
      console.error('[api] unhandled error', err);
      return fail(500, 'INTERNAL_ERROR', 'Something went wrong on our side.');
    }
  };
}

/** Parse a JSON request body → object. Malformed/empty JSON is a 400. */
export async function readJson(req) {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    throw new AppError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }
}

/**
 * zod puts field errors in `fieldErrors` but form-level problems
 * (unknown keys under .strict(), type mismatch at root) in `formErrors`.
 * Merge both so the client always sees something actionable.
 */
export function zodDetails(error) {
  const flat = error.flatten();
  const details = { ...flat.fieldErrors };
  if (flat.formErrors.length) details._form = flat.formErrors;
  return details;
}

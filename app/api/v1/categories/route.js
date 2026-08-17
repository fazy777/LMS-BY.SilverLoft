import { handle, ok } from '@/lib/errors.js';
import { query } from '@/lib/db.js';

export const runtime = 'nodejs';

/**
 * GET /api/v1/categories — public category list
 */
export const GET = handle(async () => {
  const [rows] = await query('SELECT id, name, slug FROM categories ORDER BY name ASC');
  return ok(rows);
});

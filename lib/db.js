import mysql from 'mysql2/promise';

/**
 * MySQL connection pool (InnoDB) — per LMS_ARCHITECTURE.md §2/§4.
 * Money is always integer cents, so no float conversion is performed.
 */
const pool = mysql.createPool({
  host: (process.env.MYSQL_HOST || 'localhost').trim(),
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: (process.env.MYSQL_USER || 'root').trim(),
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE?.trim(),
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
  waitForConnections: true,
  supportBigNumbers: true,
  timezone: 'Z', // store/return DATETIME consistently in UTC
});

/** Run a parameterized query. Returns [rows, fields]. */
export const query = (sql, params = []) => pool.execute(sql, params);

/**
 * Run `fn(connection)` inside a DB transaction.
 * Use for multi-statement money-critical writes (payments, enrollments, ledger).
 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;

import mysql from 'mysql2/promise';

/**
 * MySQL connection pool configuration (InnoDB)
 * Supports:
 * 1. DATABASE_URL / MYSQL_URL connection strings (cloud providers like TiDB, Aiven, Railway, AWS)
 * 2. Discrete MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE
 * 3. SSL encryption for cloud MySQL databases
 * 4. Serverless connection pooling with globalThis caching for Vercel/Next.js
 */

function createDbPool() {
  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_URI;
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  const connectionLimit = Number(process.env.MYSQL_CONNECTION_LIMIT ?? (isServerless ? 5 : 10));

  const host = (process.env.MYSQL_HOST || 'localhost').trim();
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  // SSL config: Enabled if MYSQL_SSL is 'true'/'require', or if running against a remote host on Vercel/production
  let ssl = undefined;
  if (process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === 'require') {
    ssl = { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED === 'true' };
  } else if (!isLocalhost && (process.env.NODE_ENV === 'production' || isServerless)) {
    // Default to SSL for remote cloud databases in production/serverless
    ssl = { rejectUnauthorized: false };
  }

  if (connectionUri) {
    return mysql.createPool({
      uri: connectionUri.trim(),
      connectionLimit,
      connectTimeout: 5000,
      waitForConnections: true,
      supportBigNumbers: true,
      timezone: 'Z',
      ...(ssl ? { ssl } : {}),
    });
  }

  return mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: (process.env.MYSQL_USER || 'root').trim(),
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE?.trim(),
    connectionLimit,
    connectTimeout: 5000,
    waitForConnections: true,
    supportBigNumbers: true,
    timezone: 'Z', // store/return DATETIME consistently in UTC
    ...(ssl ? { ssl } : {}),
  });
}

// Cache pool on globalThis to avoid creating multiple pools across serverless invocations
const globalForDb = globalThis;
const pool = globalForDb._mysqlPool || createDbPool();

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  globalForDb._mysqlPool = pool;
}

/** Run a parameterized query. Returns [rows, fields]. */
export const query = async (sql, params = []) => {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  const hasRemoteDb = Boolean(process.env.DATABASE_URL || process.env.MYSQL_URL || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'localhost' && process.env.MYSQL_HOST !== '127.0.0.1'));

  if (isServerless && !hasRemoteDb) {
    const error = new Error('DATABASE_NOT_CONFIGURED: Vercel serverless functions cannot connect to localhost. Please configure DATABASE_URL or MYSQL_HOST in your Vercel Project Environment Variables.');
    error.code = 'DATABASE_NOT_CONFIGURED';
    console.error(error.message);
    throw error;
  }

  try {
    return await pool.execute(sql, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error(
        `[Database Connection Error] Failed to connect to MySQL database (${err.code}). ` +
        (process.env.VERCEL ? 'If you are running on Vercel, ensure you are using a cloud-hosted MySQL database (not localhost) and that MYSQL_HOST or DATABASE_URL is set in Vercel Environment Variables.' : '')
      );
    }
    throw err;
  }
};

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


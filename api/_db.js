import mysql from 'mysql2/promise';

console.log('[DB] Initializing connection pool with:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 6,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

export async function query(sql, params = []) {
  try {
    console.log('[DB] Executing query:', sql.substring(0, 50) + '...');
    const [rows] = await pool.execute(sql, params);
    console.log('[DB] Query result rows:', rows.length);
    return rows;
  } catch (err) {
    console.error('[DB] Query error:', err.message);
    throw err;
  }
}

export default pool;

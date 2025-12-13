import mysql from 'mysql2/promise';

let pool;

function getPool() {
  if (!pool) {
    console.log('[DB] Creating MySQL pool');

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
    });
  }

  return pool;
}

export async function query(sql, params = []) {
  try {
    const pool = getPool();
    console.log('[DB] Executing query:', sql.substring(0, 50));
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('[DB] Query error:', err);
    throw err;
  }
}

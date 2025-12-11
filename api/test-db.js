import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  console.log('[TEST-DB] Starting database connection test...');
  
  // 1. Verificar variáveis de ambiente
  console.log('[TEST-DB] Environment Variables:', {
    DB_HOST: process.env.DB_HOST || '❌ NOT SET',
    DB_USER: process.env.DB_USER || '❌ NOT SET',
    DB_PASS: process.env.DB_PASS ? '✓ SET' : '❌ NOT SET',
    DB_NAME: process.env.DB_NAME || '❌ NOT SET',
  });

  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      DB_HOST: process.env.DB_HOST || null,
      DB_USER: process.env.DB_USER || null,
      DB_PASS: process.env.DB_PASS ? '***' : null,
      DB_NAME: process.env.DB_NAME || null,
    },
    connectionTest: null,
    queryTest: null,
    errors: [],
  };

  try {
    // 2. Tentar criar uma conexão
    console.log('[TEST-DB] Attempting to create connection...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log('[TEST-DB] ✓ Connection established!');
    testResults.connectionTest = {
      status: 'success',
      message: 'Connected to MySQL successfully',
    };

    // 3. Tentar executar uma query simples
    console.log('[TEST-DB] Testing query execution...');
    
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM goleiros');
      console.log('[TEST-DB] ✓ Query executed! Goleiros count:', rows[0].count);
      
      testResults.queryTest = {
        status: 'success',
        message: 'Query executed successfully',
        data: {
          table: 'goleiros',
          totalRows: rows[0].count,
        },
      };
    } catch (queryErr) {
      console.error('[TEST-DB] ❌ Query error:', queryErr.message);
      testResults.queryTest = {
        status: 'error',
        message: queryErr.message,
      };
      testResults.errors.push(queryErr.message);
    }

    // 4. Testar query na tabela partidas
    try {
      const [rows2] = await connection.execute('SELECT COUNT(*) as count FROM partidas');
      console.log('[TEST-DB] ✓ Partidas query OK! Count:', rows2[0].count);
      
      testResults.partidasTest = {
        status: 'success',
        table: 'partidas',
        totalRows: rows2[0].count,
      };
    } catch (queryErr) {
      console.error('[TEST-DB] ❌ Partidas query error:', queryErr.message);
      testResults.partidasTest = {
        status: 'error',
        message: queryErr.message,
      };
      testResults.errors.push(queryErr.message);
    }

    await connection.end();
    console.log('[TEST-DB] ✓ Connection closed');

    return res.status(200).json({
      success: true,
      message: 'Database connection test completed',
      ...testResults,
    });

  } catch (err) {
    console.error('[TEST-DB] ❌ FATAL ERROR:', err.message);
    console.error('[TEST-DB] Error details:', err);
    
    testResults.connectionTest = {
      status: 'error',
      message: err.message,
      code: err.code,
    };
    testResults.errors.push(err.message);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      ...testResults,
      errorDetails: {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
      },
    });
  }
}

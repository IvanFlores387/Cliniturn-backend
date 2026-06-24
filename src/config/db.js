const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: Number(env.db.port),
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,

  waitForConnections: true,
  connectionLimit: env.db.connectionLimit || 5,
  maxIdle: env.db.connectionLimit || 5,
  idleTimeout: 60000,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  connectTimeout: 20000,
  namedPlaceholders: false,
});

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();

    console.log('Conectado a MySQL correctamente');
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
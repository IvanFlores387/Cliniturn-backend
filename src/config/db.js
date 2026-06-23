const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: false,
});

async function testConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log('Conectado a MySQL correctamente');
  } finally {
    connection.release();
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;

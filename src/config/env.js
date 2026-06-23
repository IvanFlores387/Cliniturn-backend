require('dotenv').config();

function required(name, fallback = null) {
  const value = process.env[name] ?? fallback;

  if (value === null || value === undefined || value === '') {
    throw new Error(`Variable de entorno obligatoria no configurada: ${name}`);
  }

  return value;
}

function numberEnv(name, fallback) {
  const raw = process.env[name] ?? fallback;
  const value = Number(raw);

  if (Number.isNaN(value)) {
    throw new Error(`Variable de entorno ${name} debe ser numérica.`);
  }

  return value;
}

function listEnv(name, fallback = '') {
  return String(process.env[name] ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: numberEnv('PORT', 3000),

  db: {
    host: required('DB_HOST'),
    port: numberEnv('DB_PORT', 3306),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    database: required('DB_NAME'),
    connectionLimit: numberEnv('DB_CONNECTION_LIMIT', 10),
  },

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  adminRegisterCode: required('ADMIN_REGISTER_CODE'),

  corsOrigins: listEnv(
    'CORS_ORIGINS',
    'http://localhost:4200,http://localhost:4201,https://cliniturn-frontend.vercel.app,https://cliniturn-fronted.vercel.app'
  ),

  rateLimit: {
    windowMs: numberEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: numberEnv('RATE_LIMIT_MAX', 100),
  },
};

if (!env.isProduction && env.jwtSecret === 'default_secret') {
  throw new Error('JWT_SECRET no debe usar default_secret. Configura un secreto real en .env.');
}

module.exports = env;

const env = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'cliniturn_super_secreto_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

module.exports = env;
const env = require('../config/env');

function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  console.error({
    message: err.message,
    method: req.method,
    path: req.originalUrl,
    stack: env.isProduction ? undefined : err.stack,
  });

  return res.status(status).json({
    ok: false,
    message: status === 500 ? 'Error interno del servidor.' : err.message,
    ...(env.isProduction ? {} : { error: err.message }),
  });
}

module.exports = errorMiddleware;

const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const env = require('../config/env');

function securityMiddleware(app) {
  app.use(helmet());
  app.use(compression());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        ok: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
      },
    })
  );

  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

module.exports = securityMiddleware;

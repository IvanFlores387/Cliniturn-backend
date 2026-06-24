const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const env = require('../config/env');

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CliniTurn API REST',
      version: '1.0.0',
      description: 'Documentación de servicios web para CliniTurn.',
    },
    servers: [
  {
    url:
      process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${env.port}`,
    description: env.isProduction
      ? 'Servidor de producción'
      : 'Servidor local',
  },
],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
}

module.exports = setupSwagger;

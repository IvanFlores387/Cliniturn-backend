const app = require('./src/app');
const env = require('./src/config/env');
const db = require('./src/config/db');

async function bootstrap() {
  try {
    await db.testConnection();

    app.listen(env.port, () => {
      console.log(`Servidor CliniTurn corriendo en puerto ${env.port}`);
      console.log(`Documentación Swagger: http://localhost:${env.port}/api/docs`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

bootstrap();

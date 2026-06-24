const app = require('./src/app');
const env = require('./src/config/env');
const db = require('./src/config/db');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectToDatabase(maxAttempts = 8, delayMs = 5000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await db.testConnection();

      console.log(
        `Conexión a MySQL establecida en el intento ${attempt}/${maxAttempts}`
      );

      return;
    } catch (error) {
      lastError = error;

      console.error(
        `Intento ${attempt}/${maxAttempts} de conexión a MySQL falló: ${error.message}`
      );

      if (attempt < maxAttempts) {
        console.log(
          `Nuevo intento de conexión en ${delayMs / 1000} segundos...`
        );

        await wait(delayMs);
      }
    }
  }

  throw lastError;
}

async function bootstrap() {
  try {
    await connectToDatabase();

    const server = app.listen(env.port, '0.0.0.0', () => {
      const externalUrl =
        process.env.RENDER_EXTERNAL_URL ||
        `http://localhost:${env.port}`;

      console.log(`Servidor CliniTurn corriendo en puerto ${env.port}`);
      console.log(`Documentación Swagger: ${externalUrl}/api/docs`);
      console.log(`Health check: ${externalUrl}/health`);
    });

    async function shutdown(signal) {
      console.log(`${signal} recibido. Cerrando servidor...`);

      server.close(async () => {
        try {
          if (typeof db.end === 'function') {
            await db.end();
          }

          console.log('Servidor cerrado correctamente.');
          process.exit(0);
        } catch (error) {
          console.error('Error al cerrar el servidor:', error.message);
          process.exit(1);
        }
      });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error(
      'No se pudo iniciar el servidor después de varios intentos:',
      error.message
    );

    process.exit(1);
  }
}

bootstrap();
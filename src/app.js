const express = require('express');

// Rutas de autenticación y usuarios
const authRoutes = require('./routes/auth.routes');

// Rutas principales de CliniTurn
const specialtiesRoutes = require('./routes/specialties.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const consultoriosRoutes = require('./routes/consultorios.routes');
const adminDoctorsRoutes = require('./routes/admin-doctors.routes');
const recordsRoutes = require('./routes/records.routes');
const consultationsRoutes = require('./routes/consultations.routes');
const reportsRoutes = require('./routes/reports.routes');
const historyRoutes = require('./routes/history.routes');

// Middlewares generales
const securityMiddleware = require('./middlewares/security.middleware');
const notFoundMiddleware = require('./middlewares/not-found.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

// Documentación Swagger
const setupSwagger = require('./docs/swagger');

const app = express();

/*
|--------------------------------------------------------------------------
| Seguridad general
|--------------------------------------------------------------------------
|
| Este middleware debe encargarse de:
| - CORS
| - Helmet
| - Rate limiting
| - Protección HTTP
| - Configuración de confianza del proxy
|
*/
securityMiddleware(app);

/*
|--------------------------------------------------------------------------
| Lectura del cuerpo de las solicitudes
|--------------------------------------------------------------------------
*/

// Acepta solicitudes con contenido JSON.
// El límite evita que se envíen cuerpos excesivamente grandes.
app.use(express.json({ limit: '1mb' }));

// Permite recibir datos enviados mediante formularios HTML.
app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  })
);

/*
|--------------------------------------------------------------------------
| Rutas generales
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'API CliniTurn funcionando correctamente 🚀',
  });
});

// Ruta utilizada para comprobar que el backend sigue disponible.
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'cliniturn-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| Documentación Swagger
|--------------------------------------------------------------------------
*/

setupSwagger(app);

/*
|--------------------------------------------------------------------------
| Rutas de la API
|--------------------------------------------------------------------------
*/

app.use('/api/auth', authRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultorios', consultoriosRoutes);
app.use('/api/admin/doctors', adminDoctorsRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/history', historyRoutes);

/*
|--------------------------------------------------------------------------
| Manejo de rutas inexistentes
|--------------------------------------------------------------------------
|
| Debe colocarse después de todas las rutas.
|
*/

app.use(notFoundMiddleware);

/*
|--------------------------------------------------------------------------
| Manejo global de errores
|--------------------------------------------------------------------------
|
| Debe ser el último middleware registrado.
|
*/

app.use(errorMiddleware);

module.exports = app;
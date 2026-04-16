const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes.js');
const specialtiesRoutes = require('./routes/specialties.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');

const app = express();

const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'https://cliniturn-frontend.vercel.app',
  'https://cliniturn-fronted.vercel.app',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API funcionando correctamente 🚀',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada.',
  });
});

app.use((err, req, res, next) => {
  console.error('Error global:', err);

  res.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
    error: err.message,
  });
});

module.exports = app;
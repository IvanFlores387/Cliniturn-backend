const express = require('express');
const cors = require('cors');

// Rutas
const authRoutes = require('./routes/auth.routes.js');
const specialtiesRoutes = require('./routes/specialties.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');

const app = express();


// =============================
// CONFIGURACIÓN CORS
// =============================
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://cliniturn-fronted.vercel.app'
  ],
  credentials: true,
}));


// =============================
// MIDDLEWARES
// =============================
app.use(express.json());


// =============================
// RUTA BASE (TEST)
// =============================
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente 🚀' });
});


// =============================
// REGISTRO DE RUTAS
// =============================

// Auth (login, registro)
app.use('/api/auth', authRoutes);

// Especialidades
app.use('/api/specialties', specialtiesRoutes);

// Doctores
app.use('/api/doctors', doctorsRoutes);

// Citas médicas
app.use('/api/appointments', appointmentsRoutes);


// =============================
// MANEJO DE RUTAS NO ENCONTRADAS
// =============================
app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada ❌'
  });
});


// =============================
// MANEJO DE ERRORES GLOBAL
// =============================
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(500).json({
    message: 'Error interno del servidor ❌',
    error: err.message
  });
});


module.exports = app;
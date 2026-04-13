const express = require('express');
const cors = require('cors');

// Rutas
const authRoutes = require('./routes/auth.routes.js');
const specialtiesRoutes = require('./routes/specialties.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const adminDoctorsRoutes = require('./routes/admin-doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const consultoriosRoutes = require('./routes/consultorios.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://cliniturn-fronted.vercel.app'
  ],
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/admin/doctors', adminDoctorsRoutes);
app.use('/api/consultorios', consultoriosRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada ❌'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(500).json({
    message: 'Error interno del servidor ❌',
    error: err.message
  });
});

module.exports = app;
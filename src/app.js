const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes.js');

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

module.exports = app;
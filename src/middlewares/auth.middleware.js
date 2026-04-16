const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Token no proporcionado.',
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret);

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Usuario no válido.',
      });
    }

    const { password, ...safeUser } = user;

    if (safeUser.role === 'medico') {
      const [doctorRows] = await db.execute(
        'SELECT id FROM doctors WHERE user_id = ? LIMIT 1',
        [safeUser.id]
      );

      if (doctorRows.length > 0) {
        safeUser.doctor_id = doctorRows[0].id;
      }
    }

    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado.',
      error: error.message,
    });
  }
}

module.exports = authMiddleware;
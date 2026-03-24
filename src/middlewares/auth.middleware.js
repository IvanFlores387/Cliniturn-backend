const jwt = require('jsonwebtoken');
const { readDb } = require('../data/db');
const env = require('../config/env');

function authMiddleware(req, res, next) {
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

    const db = readDb();
    db.users = db.users || [];

    const user = db.users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Usuario no válido.',
      });
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado.',
    });
  }
}

module.exports = authMiddleware;
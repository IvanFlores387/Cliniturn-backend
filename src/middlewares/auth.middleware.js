const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async function authMiddleware(req, res, next) {
  try {
    // 1. Obtener header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Token no proporcionado.',
      });
    }

    // 2. Extraer token
    const token = authHeader.split(' ')[1];

    // 3. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Buscar usuario + datos de doctor (si existe)
    const [users] = await db.execute(
      `
        SELECT
          u.id,
          u.nombre,
          u.apellidos,
          u.email,
          u.role,
          u.activo,
          d.id AS doctor_id,
          d.specialty_id,
          d.consultorio_id
        FROM users u
        LEFT JOIN doctors d ON d.user_id = u.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [decoded.id]
    );

    const user = users[0];

    // 5. Validar usuario existente
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Usuario no encontrado.',
      });
    }

    // 6. Validar usuario activo
    if (Number(user.activo) !== 1) {
      return res.status(401).json({
        ok: false,
        message: 'Usuario inactivo.',
      });
    }

    // 7. Adjuntar usuario al request
    req.user = user;

    // Ejemplo :
    /*
      req.user = {
        id,
        nombre,
        apellidos,
        email,
        role,
        activo,
        doctor_id,         //  CLAVE para citas
        specialty_id,
        consultorio_id
      }
    */

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado.',
    });
  }
};
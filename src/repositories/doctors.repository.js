const db = require('../config/db');

async function findAllActiveBySpecialty(specialtyId) {
  let sql = `
    SELECT 
      d.id,
      d.user_id,
      d.specialty_id,
      d.consultorio_id,
      d.duracion_cita_minutos,
      d.activo,
      u.nombre,
      u.apellidos,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre
    FROM doctors d
    INNER JOIN users u ON u.id = d.user_id
    INNER JOIN specialties s ON s.id = d.specialty_id
    INNER JOIN consultorios c ON c.id = d.consultorio_id
    WHERE d.activo = 1 AND u.activo = 1
  `;

  const params = [];

  if (specialtyId) {
    sql += ` AND d.specialty_id = ?`;
    params.push(specialtyId);
  }

  sql += ` ORDER BY u.nombre ASC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findDoctorById(id) {
  const [rows] = await db.execute(`
    SELECT 
      d.*,
      u.nombre,
      u.apellidos,
      u.activo AS user_activo,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre
    FROM doctors d
    INNER JOIN users u ON u.id = d.user_id
    INNER JOIN specialties s ON s.id = d.specialty_id
    INNER JOIN consultorios c ON c.id = d.consultorio_id
    WHERE d.id = ?
    LIMIT 1
  `, [id]);

  return rows[0] || null;
}

module.exports = {
  findAllActiveBySpecialty,
  findDoctorById,
};
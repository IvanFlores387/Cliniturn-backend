const db = require('../config/db');

async function findSchedulesByDoctorAndDay(doctorId, diaSemana) {
  const [rows] = await db.execute(`
    SELECT *
    FROM doctor_schedules
    WHERE doctor_id = ?
      AND dia_semana = ?
      AND activo = 1
    ORDER BY hora_inicio ASC
  `, [doctorId, diaSemana]);

  return rows;
}

module.exports = {
  findSchedulesByDoctorAndDay,
};
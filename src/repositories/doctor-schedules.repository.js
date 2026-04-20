const db = require('../config/db');
const { getDefaultDoctorSchedules } = require('../utils/default-doctor-schedules');

async function ensureDefaultSchedules(doctorId, connection = db) {
  const defaults = getDefaultDoctorSchedules();

  if (!defaults.length) {
    return false;
  }

  const selectSql = defaults
    .map(
      () => `
        SELECT
          ? AS doctor_id,
          ? AS dia_semana,
          ? AS hora_inicio,
          ? AS hora_fin,
          ? AS activo,
          NOW() AS created_at,
          NOW() AS updated_at
      `
    )
    .join(' UNION ALL ');

  const params = defaults.flatMap((item) => [
    Number(doctorId),
    Number(item.dia_semana),
    item.hora_inicio,
    item.hora_fin,
    Number(item.activo ?? 1),
  ]);

  params.push(Number(doctorId));

  const [result] = await connection.execute(
    `
      INSERT INTO doctor_schedules (
        doctor_id,
        dia_semana,
        hora_inicio,
        hora_fin,
        activo,
        created_at,
        updated_at
      )
      SELECT
        seed.doctor_id,
        seed.dia_semana,
        seed.hora_inicio,
        seed.hora_fin,
        seed.activo,
        seed.created_at,
        seed.updated_at
      FROM (
        ${selectSql}
      ) AS seed
      WHERE NOT EXISTS (
        SELECT 1
        FROM doctor_schedules ds
        WHERE ds.doctor_id = ?
        LIMIT 1
      )
    `,
    params
  );

  return Number(result.affectedRows || 0) > 0;
}

module.exports = {
  ensureDefaultSchedules,
};
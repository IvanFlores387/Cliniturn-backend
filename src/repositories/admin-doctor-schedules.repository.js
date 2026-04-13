const db = require('../config/db');

async function doctorExists(doctorId) {
  const [rows] = await db.execute(
    `
      SELECT
        d.id,
        d.user_id,
        d.activo,
        u.nombre,
        u.apellidos,
        u.activo AS user_activo
      FROM doctors d
      INNER JOIN users u ON u.id = d.user_id
      WHERE d.id = ?
      LIMIT 1
    `,
    [Number(doctorId)]
  );

  return rows[0] || null;
}

async function findAllByDoctor(doctorId) {
  const [rows] = await db.execute(
    `
      SELECT
        ds.id,
        ds.doctor_id,
        ds.dia_semana,
        ds.hora_inicio,
        ds.hora_fin,
        ds.activo,
        ds.created_at,
        ds.updated_at
      FROM doctor_schedules ds
      WHERE ds.doctor_id = ?
      ORDER BY ds.dia_semana ASC, ds.hora_inicio ASC
    `,
    [Number(doctorId)]
  );

  return rows;
}

async function findById(scheduleId) {
  const [rows] = await db.execute(
    `
      SELECT
        ds.id,
        ds.doctor_id,
        ds.dia_semana,
        ds.hora_inicio,
        ds.hora_fin,
        ds.activo,
        ds.created_at,
        ds.updated_at
      FROM doctor_schedules ds
      WHERE ds.id = ?
      LIMIT 1
    `,
    [Number(scheduleId)]
  );

  return rows[0] || null;
}

async function hasOverlap({
  doctor_id,
  dia_semana,
  hora_inicio,
  hora_fin,
  excludeScheduleId = null,
}) {
  let sql = `
    SELECT id
    FROM doctor_schedules
    WHERE doctor_id = ?
      AND dia_semana = ?
      AND activo = 1
      AND (
        ? < hora_fin AND ? > hora_inicio
      )
  `;

  const params = [
    Number(doctor_id),
    Number(dia_semana),
    hora_inicio,
    hora_fin,
  ];

  if (excludeScheduleId) {
    sql += ` AND id <> ?`;
    params.push(Number(excludeScheduleId));
  }

  sql += ` LIMIT 1`;

  const [rows] = await db.execute(sql, params);
  return !!rows[0];
}

async function create({
  doctor_id,
  dia_semana,
  hora_inicio,
  hora_fin,
  activo = 1,
}) {
  const [result] = await db.execute(
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
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      Number(doctor_id),
      Number(dia_semana),
      hora_inicio,
      hora_fin,
      Number(activo),
    ]
  );

  return findById(result.insertId);
}

async function update(
  scheduleId,
  {
    dia_semana,
    hora_inicio,
    hora_fin,
    activo = 1,
  }
) {
  await db.execute(
    `
      UPDATE doctor_schedules
      SET
        dia_semana = ?,
        hora_inicio = ?,
        hora_fin = ?,
        activo = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
    [
      Number(dia_semana),
      hora_inicio,
      hora_fin,
      Number(activo),
      Number(scheduleId),
    ]
  );

  return findById(scheduleId);
}

async function remove(scheduleId) {
  await db.execute(
    `
      DELETE FROM doctor_schedules
      WHERE id = ?
    `,
    [Number(scheduleId)]
  );
}

module.exports = {
  doctorExists,
  findAllByDoctor,
  findById,
  hasOverlap,
  create,
  update,
  remove,
};
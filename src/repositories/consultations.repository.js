const db = require('../config/db');

function parseJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapConsultation(row) {
  if (!row) return null;
  return {
    ...row,
    vital_signs: parseJson(row.vital_signs),
  };
}

async function findAppointmentForConsultation(connection, appointmentId) {
  const [rows] = await connection.execute(
    `
      SELECT
        a.id,
        a.paciente_id,
        a.doctor_id,
        a.specialty_id,
        a.consultorio_id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.motivo_consulta,
        a.estado,
        p.nombre AS paciente_nombre,
        p.apellidos AS paciente_apellidos
      FROM appointments a
      INNER JOIN users p ON p.id = a.paciente_id
      WHERE a.id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [Number(appointmentId)]
  );
  return rows[0] || null;
}

async function findByAppointmentIdTx(connection, appointmentId) {
  const [rows] = await connection.execute(
    `SELECT id FROM consultations WHERE appointment_id = ? LIMIT 1 FOR UPDATE`,
    [Number(appointmentId)]
  );
  return rows[0] || null;
}

async function createTx(connection, data) {
  const [result] = await connection.execute(
    `
      INSERT INTO consultations (
        appointment_id,
        record_id,
        doctor_id,
        paciente_id,
        diagnosis,
        treatment,
        observations,
        vital_signs,
        general_indications,
        consultation_date,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, NOW(), NOW(), NOW())
    `,
    [
      Number(data.appointment_id),
      Number(data.record_id),
      Number(data.doctor_id),
      Number(data.paciente_id),
      data.diagnosis,
      data.treatment,
      data.observations,
      data.vital_signs ? JSON.stringify(data.vital_signs) : null,
      data.general_indications,
    ]
  );
  return result.insertId;
}

async function updateTx(connection, id, data) {
  await connection.execute(
    `
      UPDATE consultations
      SET diagnosis = ?,
          treatment = ?,
          observations = ?,
          vital_signs = CAST(? AS JSON),
          general_indications = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      data.diagnosis,
      data.treatment,
      data.observations,
      data.vital_signs ? JSON.stringify(data.vital_signs) : null,
      data.general_indications,
      Number(id),
    ]
  );
  return findById(id);
}

async function markAppointmentAttendedTx(connection, appointmentId) {
  await connection.execute(
    `UPDATE appointments SET estado = 'atendida', updated_at = NOW() WHERE id = ?`,
    [Number(appointmentId)]
  );
}

async function findById(id) {
  const [rows] = await db.execute(
    `
      SELECT
        c.id,
        c.appointment_id,
        c.record_id,
        c.doctor_id,
        c.paciente_id,
        c.diagnosis,
        c.treatment,
        c.observations,
        c.vital_signs,
        c.general_indications,
        c.consultation_date,
        c.created_at,
        c.updated_at,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado AS appointment_estado,
        a.motivo_consulta,
        p.nombre AS paciente_nombre,
        p.apellidos AS paciente_apellidos,
        CAST(p.id AS CHAR) AS paciente_matricula,
        du.nombre AS doctor_nombre,
        du.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        co.nombre AS consultorio_nombre
      FROM consultations c
      INNER JOIN appointments a ON a.id = c.appointment_id
      INNER JOIN users p ON p.id = c.paciente_id
      INNER JOIN doctors d ON d.id = c.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      LEFT JOIN specialties s ON s.id = a.specialty_id
      LEFT JOIN consultorios co ON co.id = a.consultorio_id
      WHERE c.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );
  return mapConsultation(rows[0]);
}

async function findByAppointmentId(appointmentId) {
  const [rows] = await db.execute(
    `SELECT id FROM consultations WHERE appointment_id = ? LIMIT 1`,
    [Number(appointmentId)]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
}

async function findByPatientId(patientId, authUser = null) {
  let sql = `
    SELECT c.id
    FROM consultations c
    WHERE c.paciente_id = ?
  `;
  const params = [Number(patientId)];

  if (authUser?.role === 'medico') {
    sql += ` AND c.doctor_id = ?`;
    params.push(Number(authUser.doctor_id));
  }

  if (authUser?.role === 'paciente') {
    sql += ` AND c.paciente_id = ?`;
    params.push(Number(authUser.id));
  }

  sql += ` ORDER BY c.consultation_date DESC, c.id DESC`;

  const [rows] = await db.execute(sql, params);
  const result = [];
  for (const row of rows) {
    result.push(await findById(row.id));
  }
  return result;
}

module.exports = {
  db,
  findAppointmentForConsultation,
  findByAppointmentIdTx,
  createTx,
  updateTx,
  markAppointmentAttendedTx,
  findById,
  findByAppointmentId,
  findByPatientId,
};

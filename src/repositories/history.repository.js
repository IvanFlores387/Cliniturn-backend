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

async function doctorHasAttendedPatient(doctorId, patientId) {
  const [rows] = await db.execute(
    `
      SELECT 1
      FROM appointments a
      WHERE a.doctor_id = ?
        AND a.paciente_id = ?
        AND a.estado IN ('confirmada', 'atendida')
      LIMIT 1
    `,
    [Number(doctorId), Number(patientId)]
  );
  return rows.length > 0;
}

async function getPatientGeneralData(patientId) {
  const [rows] = await db.execute(
    `
      SELECT
        u.id AS paciente_id,
        u.nombre AS paciente_nombre,
        u.apellidos AS paciente_apellidos,
        u.email AS paciente_email,
        u.telefono AS paciente_telefono,
        CAST(u.id AS CHAR) AS paciente_matricula,
        mr.id AS record_id,
        mr.created_at AS record_created_at,
        mr.updated_at AS record_updated_at
      FROM users u
      LEFT JOIN medical_records mr ON mr.paciente_id = u.id
      WHERE u.id = ? AND u.role = 'paciente'
      LIMIT 1
    `,
    [Number(patientId)]
  );
  return rows[0] || null;
}

async function getAppointments(patientId, authUser) {
  let sql = `
    SELECT
      a.id,
      a.fecha,
      a.hora_inicio,
      a.hora_fin,
      a.estado,
      a.motivo_consulta,
      a.created_at,
      a.updated_at,
      d.id AS doctor_id,
      du.nombre AS doctor_nombre,
      du.apellidos AS doctor_apellidos,
      s.nombre AS specialty_nombre,
      co.nombre AS consultorio_nombre
    FROM appointments a
    INNER JOIN doctors d ON d.id = a.doctor_id
    INNER JOIN users du ON du.id = d.user_id
    LEFT JOIN specialties s ON s.id = a.specialty_id
    LEFT JOIN consultorios co ON co.id = a.consultorio_id
    WHERE a.paciente_id = ?
  `;
  const params = [Number(patientId)];

  if (authUser.role === 'medico') {
    sql += ` AND a.doctor_id = ?`;
    params.push(Number(authUser.doctor_id));
  }

  sql += ` ORDER BY a.fecha DESC, a.hora_inicio DESC`;
  const [rows] = await db.execute(sql, params);
  return rows;
}

async function getConsultations(patientId, authUser) {
  let sql = `
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
      du.nombre AS doctor_nombre,
      du.apellidos AS doctor_apellidos,
      s.nombre AS specialty_nombre,
      co.nombre AS consultorio_nombre
    FROM consultations c
    INNER JOIN appointments a ON a.id = c.appointment_id
    INNER JOIN doctors d ON d.id = c.doctor_id
    INNER JOIN users du ON du.id = d.user_id
    LEFT JOIN specialties s ON s.id = a.specialty_id
    LEFT JOIN consultorios co ON co.id = a.consultorio_id
    WHERE c.paciente_id = ?
  `;
  const params = [Number(patientId)];

  if (authUser.role === 'medico') {
    sql += ` AND c.doctor_id = ?`;
    params.push(Number(authUser.doctor_id));
  }

  sql += ` ORDER BY c.consultation_date DESC, c.id DESC`;
  const [rows] = await db.execute(sql, params);
  return rows.map(mapConsultation);
}

async function getPatientHistory(patientId, authUser) {
  const patient = await getPatientGeneralData(patientId);
  if (!patient) return null;

  const [appointments, consultations] = await Promise.all([
    getAppointments(patientId, authUser),
    getConsultations(patientId, authUser),
  ]);

  return {
    patient,
    appointments,
    consultations,
    summary: {
      total_appointments: appointments.length,
      total_consultations: consultations.length,
      last_consultation_date: consultations[0]?.consultation_date || null,
    },
  };
}

async function getDoctorPatients(doctorId) {
  const [rows] = await db.execute(
    `
      SELECT
        u.id AS paciente_id,
        u.nombre AS paciente_nombre,
        u.apellidos AS paciente_apellidos,
        u.email AS paciente_email,
        u.telefono AS paciente_telefono,
        CAST(u.id AS CHAR) AS paciente_matricula,
        COUNT(DISTINCT a.id) AS total_citas,
        SUM(CASE WHEN a.estado = 'atendida' THEN 1 ELSE 0 END) AS citas_atendidas,
        MAX(a.fecha) AS ultima_cita
      FROM appointments a
      INNER JOIN users u ON u.id = a.paciente_id
      WHERE a.doctor_id = ?
        AND a.estado IN ('confirmada', 'atendida')
      GROUP BY u.id, u.nombre, u.apellidos, u.email, u.telefono
      ORDER BY ultima_cita DESC, u.nombre ASC
    `,
    [Number(doctorId)]
  );

  return rows.map((row) => ({
    ...row,
    total_citas: Number(row.total_citas || 0),
    citas_atendidas: Number(row.citas_atendidas || 0),
  }));
}

module.exports = {
  doctorHasAttendedPatient,
  getPatientHistory,
  getDoctorPatients,
};

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

function mapRecord(row) {
  if (!row) return null;

  return {
    ...row,
    vital_signs: parseJson(row.vital_signs),
  };
}

async function findOrCreateByPatientId(connection, patientId) {
  const [existing] = await connection.execute(
    `
      SELECT id, paciente_id, created_at, updated_at
      FROM medical_records
      WHERE paciente_id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [Number(patientId)]
  );

  if (existing[0]) return existing[0];

  const [result] = await connection.execute(
    `
      INSERT INTO medical_records (paciente_id, created_at, updated_at)
      VALUES (?, NOW(), NOW())
    `,
    [Number(patientId)]
  );

  const [rows] = await connection.execute(
    `
      SELECT id, paciente_id, created_at, updated_at
      FROM medical_records
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId]
  );

  return rows[0];
}

function buildRecordsWhereSql(filters = {}, authUser = null) {
  let whereSql = `WHERE 1 = 1`;
  const params = [];

  if (authUser?.role === 'medico') {
    whereSql += `
      AND EXISTS (
        SELECT 1
        FROM appointments a_scope
        WHERE a_scope.paciente_id = mr.paciente_id
          AND a_scope.doctor_id = ?
          AND a_scope.estado IN ('confirmada', 'atendida')
      )
    `;

    params.push(Number(authUser.doctor_id));
  }

  if (authUser?.role === 'paciente') {
    whereSql += ` AND mr.paciente_id = ?`;
    params.push(Number(authUser.id));
  }

  if (filters.search && String(filters.search).trim()) {
    whereSql += `
      AND (
        CONCAT_WS(' ', p.nombre, p.apellidos) LIKE ?
        OR p.email LIKE ?
        OR CAST(p.id AS CHAR) LIKE ?
      )
    `;

    const value = `%${String(filters.search).trim()}%`;
    params.push(value, value, value);
  }

  if (filters.doctor_id) {
    whereSql += `
      AND EXISTS (
        SELECT 1
        FROM consultations c_filter
        WHERE c_filter.record_id = mr.id
          AND c_filter.doctor_id = ?
      )
    `;

    params.push(Number(filters.doctor_id));
  }

  if (filters.fecha_inicio) {
    whereSql += ` AND DATE(COALESCE(lastc.consultation_date, mr.created_at)) >= ?`;
    params.push(filters.fecha_inicio);
  }

  if (filters.fecha_fin) {
    whereSql += ` AND DATE(COALESCE(lastc.consultation_date, mr.created_at)) <= ?`;
    params.push(filters.fecha_fin);
  }

  return { whereSql, params };
}

async function findAll(filters = {}, authUser = null) {
  const { whereSql, params } = buildRecordsWhereSql(filters, authUser);

  const [rows] = await db.execute(
    `
      SELECT
        mr.id,
        mr.paciente_id,
        p.nombre AS paciente_nombre,
        p.apellidos AS paciente_apellidos,
        CAST(p.id AS CHAR) AS paciente_matricula,
        p.email AS paciente_email,
        p.telefono AS paciente_telefono,
        mr.created_at,
        mr.updated_at,
        COUNT(c.id) AS total_consultations,
        MAX(c.consultation_date) AS last_consultation_date,
        lastc.id AS last_consultation_id,
        lastc.diagnosis AS last_diagnosis,
        lastc.treatment AS last_treatment,
        lastc.consultation_date AS last_consultation_at,
        ldu.nombre AS last_doctor_nombre,
        ldu.apellidos AS last_doctor_apellidos
      FROM medical_records mr
      INNER JOIN users p ON p.id = mr.paciente_id
      LEFT JOIN consultations lastc ON lastc.id = (
        SELECT c2.id
        FROM consultations c2
        WHERE c2.record_id = mr.id
        ORDER BY c2.consultation_date DESC, c2.id DESC
        LIMIT 1
      )
      LEFT JOIN doctors ld ON ld.id = lastc.doctor_id
      LEFT JOIN users ldu ON ldu.id = ld.user_id
      LEFT JOIN consultations c ON c.record_id = mr.id
      ${whereSql}
      GROUP BY
        mr.id,
        mr.paciente_id,
        p.nombre,
        p.apellidos,
        p.email,
        p.telefono,
        mr.created_at,
        mr.updated_at,
        lastc.id,
        lastc.diagnosis,
        lastc.treatment,
        lastc.consultation_date,
        ldu.nombre,
        ldu.apellidos
      ORDER BY COALESCE(MAX(c.consultation_date), mr.updated_at) DESC
    `,
    params
  );

  return rows;
}

async function findById(recordId, authUser = null) {
  const [rows] = await db.execute(
    `
      SELECT
        mr.id,
        mr.paciente_id,
        p.nombre AS paciente_nombre,
        p.apellidos AS paciente_apellidos,
        CAST(p.id AS CHAR) AS paciente_matricula,
        p.email AS paciente_email,
        p.telefono AS paciente_telefono,
        mr.created_at,
        mr.updated_at,
        COUNT(c.id) AS total_consultations,
        MAX(c.consultation_date) AS last_consultation_date
      FROM medical_records mr
      INNER JOIN users p ON p.id = mr.paciente_id
      LEFT JOIN consultations c ON c.record_id = mr.id
      WHERE mr.id = ?
      GROUP BY
        mr.id,
        mr.paciente_id,
        p.nombre,
        p.apellidos,
        p.email,
        p.telefono,
        mr.created_at,
        mr.updated_at
      LIMIT 1
    `,
    [Number(recordId)]
  );

  const record = rows[0] || null;

  if (!record) return null;

  if (authUser?.role === 'paciente' && Number(record.paciente_id) !== Number(authUser.id)) {
    return null;
  }

  if (authUser?.role === 'medico') {
    const [allowed] = await db.execute(
      `
        SELECT 1
        FROM appointments
        WHERE paciente_id = ?
          AND doctor_id = ?
          AND estado IN ('confirmada', 'atendida')
        LIMIT 1
      `,
      [Number(record.paciente_id), Number(authUser.doctor_id)]
    );

    if (!allowed[0]) return null;
  }

  return record;
}

async function findByPatientId(patientId, authUser = null) {
  const [rows] = await db.execute(
    `
      SELECT id
      FROM medical_records
      WHERE paciente_id = ?
      LIMIT 1
    `,
    [Number(patientId)]
  );

  if (!rows[0]) return null;

  return findById(rows[0].id, authUser);
}

async function findConsultationsByPatientId(patientId, authUser = null) {
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

  return rows.map(mapRecord);
}

module.exports = {
  db,
  findOrCreateByPatientId,
  findAll,
  findById,
  findByPatientId,
  findConsultationsByPatientId,
};
const db = require('../config/db');
const {
  normalizeTime,
  dateToWeekDayNumber,
} = require('../utils/time');

async function findDoctorByIdForUpdate(connection, doctorId) {
  const [rows] = await connection.execute(
    `
      SELECT
        d.id,
        d.user_id,
        d.specialty_id,
        d.consultorio_id,
        d.duracion_cita_minutos,
        d.activo,
        u.activo AS user_activo,
        u.nombre,
        u.apellidos
      FROM doctors d
      INNER JOIN users u ON u.id = d.user_id
      WHERE d.id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [Number(doctorId)]
  );

  return rows[0] || null;
}

async function findDoctorScheduleForSlot(connection, doctorId, fecha, horaInicio, horaFin) {
  const diaSemana = dateToWeekDayNumber(fecha);

  const [rows] = await connection.execute(
    `
      SELECT
        ds.id,
        ds.doctor_id,
        ds.dia_semana,
        ds.hora_inicio,
        ds.hora_fin,
        ds.activo
      FROM doctor_schedules ds
      WHERE ds.doctor_id = ?
        AND ds.dia_semana = ?
        AND ds.activo = 1
        AND ? >= ds.hora_inicio
        AND ? <= ds.hora_fin
      ORDER BY ds.hora_inicio ASC
      LIMIT 1
      FOR UPDATE
    `,
    [
      Number(doctorId),
      Number(diaSemana),
      normalizeTime(horaInicio),
      normalizeTime(horaFin),
    ]
  );

  return rows[0] || null;
}

async function findDoctorCollisionForUpdate(connection, doctorId, fecha, horaInicio, horaFin) {
  const [rows] = await connection.execute(
    `
      SELECT
        a.id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado
      FROM appointments a
      WHERE a.doctor_id = ?
        AND a.fecha = ?
        AND a.estado IN ('pendiente', 'confirmada', 'atendida')
        AND (? < a.hora_fin AND ? > a.hora_inicio)
      LIMIT 1
      FOR UPDATE
    `,
    [
      Number(doctorId),
      fecha,
      normalizeTime(horaInicio),
      normalizeTime(horaFin),
    ]
  );

  return rows[0] || null;
}

async function findPatientDuplicateForUpdate(connection, patientId, fecha, horaInicio) {
  const [rows] = await connection.execute(
    `
      SELECT
        a.id,
        a.paciente_id,
        a.fecha,
        a.hora_inicio,
        a.estado
      FROM appointments a
      WHERE a.paciente_id = ?
        AND a.fecha = ?
        AND a.hora_inicio = ?
        AND a.estado IN ('pendiente', 'confirmada', 'atendida')
      LIMIT 1
      FOR UPDATE
    `,
    [
      Number(patientId),
      fecha,
      normalizeTime(horaInicio),
    ]
  );

  return rows[0] || null;
}

async function createAppointmentTx(
  connection,
  {
    patient_id,
    doctor_id,
    specialty_id,
    consultorio_id,
    fecha,
    hora_inicio,
    hora_fin,
    motivo_consulta,
    estado = 'pendiente',
  }
) {
  const [result] = await connection.execute(
    `
      INSERT INTO appointments (
        paciente_id,
        doctor_id,
        specialty_id,
        consultorio_id,
        fecha,
        hora_inicio,
        hora_fin,
        motivo_consulta,
        estado,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      Number(patient_id),
      Number(doctor_id),
      Number(specialty_id),
      Number(consultorio_id),
      fecha,
      normalizeTime(hora_inicio),
      normalizeTime(hora_fin),
      String(motivo_consulta).trim(),
      estado,
    ]
  );

  return result.insertId;
}

async function findById(id) {
  const [rows] = await db.execute(
    `
      SELECT
        a.id,
        a.paciente_id AS patient_id,
        a.paciente_id,
        a.doctor_id,
        a.specialty_id,
        a.consultorio_id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.motivo_consulta,
        a.estado,
        a.notas_cancelacion,
        a.cancelada_por,
        a.created_at,
        a.updated_at,
        pu.nombre AS paciente_nombre,
        pu.apellidos AS paciente_apellidos,
        du.nombre AS doctor_nombre,
        du.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM appointments a
      INNER JOIN users pu ON pu.id = a.paciente_id
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      INNER JOIN specialties s ON s.id = a.specialty_id
      INNER JOIN consultorios c ON c.id = a.consultorio_id
      WHERE a.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
}

async function findMyAppointments(patientId, { estado = '', fecha = '' } = {}) {
  let sql = `
    SELECT
      a.id,
      a.paciente_id AS patient_id,
      a.paciente_id,
      a.doctor_id,
      a.specialty_id,
      a.consultorio_id,
      a.fecha,
      a.hora_inicio,
      a.hora_fin,
      a.motivo_consulta,
      a.estado,
      a.notas_cancelacion,
      a.cancelada_por,
      a.created_at,
      a.updated_at,
      du.nombre AS doctor_nombre,
      du.apellidos AS doctor_apellidos,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre
    FROM appointments a
    INNER JOIN doctors d ON d.id = a.doctor_id
    INNER JOIN users du ON du.id = d.user_id
    INNER JOIN specialties s ON s.id = a.specialty_id
    INNER JOIN consultorios c ON c.id = a.consultorio_id
    WHERE a.paciente_id = ?
  `;

  const params = [Number(patientId)];

  if (estado) {
    sql += ` AND a.estado = ?`;
    params.push(estado);
  }

  if (fecha) {
    sql += ` AND a.fecha = ?`;
    params.push(fecha);
  }

  sql += ` ORDER BY a.fecha DESC, a.hora_inicio DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function updateStatus(id, estado, notasCancelacion = null, canceladaPor = null) {
  await db.execute(
    `
      UPDATE appointments
      SET
        estado = ?,
        notas_cancelacion = ?,
        cancelada_por = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
    [estado, notasCancelacion, canceladaPor, Number(id)]
  );

  return findById(id);
}

async function findDoctorAppointments(doctorId, { estado = '', fecha = '' } = {}) {
  let sql = `
    SELECT
      a.id,
      a.paciente_id AS patient_id,
      a.paciente_id,
      a.doctor_id,
      a.specialty_id,
      a.consultorio_id,
      a.fecha,
      a.hora_inicio,
      a.hora_fin,
      a.motivo_consulta,
      a.estado,
      a.notas_cancelacion,
      a.cancelada_por,
      a.created_at,
      a.updated_at,
      p.nombre AS paciente_nombre,
      p.apellidos AS paciente_apellidos,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre
    FROM appointments a
    INNER JOIN users p ON p.id = a.paciente_id
    INNER JOIN specialties s ON s.id = a.specialty_id
    INNER JOIN consultorios c ON c.id = a.consultorio_id
    WHERE a.doctor_id = ?
  `;

  const params = [Number(doctorId)];

  if (estado) {
    sql += ` AND a.estado = ?`;
    params.push(estado);
  }

  if (fecha) {
    sql += ` AND a.fecha = ?`;
    params.push(fecha);
  }

  sql += ` ORDER BY a.fecha ASC, a.hora_inicio ASC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

function buildAdminAppointmentsBaseSql(filters = {}) {
  let sql = `
    FROM appointments a
    INNER JOIN users pu ON pu.id = a.paciente_id
    INNER JOIN doctors d ON d.id = a.doctor_id
    INNER JOIN users du ON du.id = d.user_id
    INNER JOIN specialties s ON s.id = a.specialty_id
    INNER JOIN consultorios c ON c.id = a.consultorio_id
    WHERE 1 = 1
  `;

  const params = [];

  if (filters.estado) {
    sql += ` AND a.estado = ?`;
    params.push(filters.estado);
  }

  if (filters.fecha) {
    sql += ` AND a.fecha = ?`;
    params.push(filters.fecha);
  }

  if (filters.medico && String(filters.medico).trim()) {
    sql += ` AND CONCAT_WS(' ', du.nombre, du.apellidos) LIKE ?`;
    params.push(`%${String(filters.medico).trim()}%`);
  }

  if (filters.especialidad && String(filters.especialidad).trim()) {
    sql += ` AND s.nombre LIKE ?`;
    params.push(`%${String(filters.especialidad).trim()}%`);
  }

  return { sql, params };
}

async function findAllAppointments(filters = {}) {
  const { sql, params } = buildAdminAppointmentsBaseSql(filters);

  const [rows] = await db.execute(
    `
      SELECT
        a.id,
        a.paciente_id AS patient_id,
        a.paciente_id,
        a.doctor_id,
        a.specialty_id,
        a.consultorio_id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.motivo_consulta,
        a.estado,
        a.notas_cancelacion,
        a.cancelada_por,
        a.created_at,
        a.updated_at,
        pu.nombre AS paciente_nombre,
        pu.apellidos AS paciente_apellidos,
        du.nombre AS doctor_nombre,
        du.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      ${sql}
      ORDER BY a.fecha DESC, a.hora_inicio DESC
    `,
    params
  );

  return rows;
}

async function findAllAppointmentsPaginated(filters = {}, pagination = { page: 1, limit: 10 }) {
  const page = Number(pagination.page) > 0 ? Number(pagination.page) : 1;
  const limit = Number(pagination.limit) > 0 ? Number(pagination.limit) : 10;
  const offset = (page - 1) * limit;

  const { sql, params } = buildAdminAppointmentsBaseSql(filters);

  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total ${sql}`,
    params
  );

  const [rows] = await db.execute(
    `
      SELECT
        a.id,
        a.paciente_id AS patient_id,
        a.paciente_id,
        a.doctor_id,
        a.specialty_id,
        a.consultorio_id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.motivo_consulta,
        a.estado,
        a.notas_cancelacion,
        a.cancelada_por,
        a.created_at,
        a.updated_at,
        pu.nombre AS paciente_nombre,
        pu.apellidos AS paciente_apellidos,
        du.nombre AS doctor_nombre,
        du.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      ${sql}
      ORDER BY a.fecha DESC, a.hora_inicio DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    params
  );

  return {
    rows,
    total: Number(countRow.total || 0),
  };
}

module.exports = {
  db,
  findDoctorByIdForUpdate,
  findDoctorScheduleForSlot,
  findDoctorCollisionForUpdate,
  findPatientDuplicateForUpdate,
  createAppointmentTx,
  findById,
  findMyAppointments,
  updateStatus,
  findDoctorAppointments,
  findAllAppointments,
  findAllAppointmentsPaginated,
};
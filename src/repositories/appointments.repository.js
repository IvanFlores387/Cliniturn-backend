const db = require('../config/db');

async function findDoctorAppointmentsByDate(doctorId, fecha) {
  const [rows] = await db.execute(`
    SELECT *
    FROM appointments
    WHERE doctor_id = ?
      AND fecha = ?
      AND estado IN ('pendiente', 'confirmada', 'atendida')
  `, [doctorId, fecha]);

  return rows;
}

async function findPatientDuplicate(pacienteId, fecha, horaInicio) {
  const [rows] = await db.execute(`
    SELECT id
    FROM appointments
    WHERE paciente_id = ?
      AND fecha = ?
      AND hora_inicio = ?
      AND estado IN ('pendiente', 'confirmada')
    LIMIT 1
  `, [pacienteId, fecha, horaInicio]);

  return rows[0] || null;
}

async function createAppointment(payload) {
  const [result] = await db.execute(`
    INSERT INTO appointments (
      paciente_id, doctor_id, specialty_id, consultorio_id,
      fecha, hora_inicio, hora_fin, motivo_consulta, estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
  `, [
    payload.paciente_id,
    payload.doctor_id,
    payload.specialty_id,
    payload.consultorio_id,
    payload.fecha,
    payload.hora_inicio,
    payload.hora_fin,
    payload.motivo_consulta,
  ]);

  return result.insertId;
}

async function findAppointmentById(id) {
  const [rows] = await db.execute(`
    SELECT *
    FROM appointments
    WHERE id = ?
    LIMIT 1
  `, [id]);

  return rows[0] || null;
}

async function updateAppointmentStatus(id, estado, extra = {}) {
  const fields = ['estado = ?'];
  const values = [estado];

  if (extra.cancelada_por !== undefined) {
    fields.push('cancelada_por = ?');
    values.push(extra.cancelada_por);
  }

  if (extra.notas_cancelacion !== undefined) {
    fields.push('notas_cancelacion = ?');
    values.push(extra.notas_cancelacion);
  }

  values.push(id);

  const [result] = await db.execute(`
    UPDATE appointments
    SET ${fields.join(', ')}
    WHERE id = ?
  `, values);

  return result.affectedRows > 0;
}

async function findMyAppointments(pacienteId) {
  const [rows] = await db.execute(`
    SELECT 
      a.*,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre,
      u.nombre AS doctor_nombre,
      u.apellidos AS doctor_apellidos
    FROM appointments a
    INNER JOIN specialties s ON s.id = a.specialty_id
    INNER JOIN consultorios c ON c.id = a.consultorio_id
    INNER JOIN doctors d ON d.id = a.doctor_id
    INNER JOIN users u ON u.id = d.user_id
    WHERE a.paciente_id = ?
    ORDER BY a.fecha DESC, a.hora_inicio DESC
  `, [pacienteId]);

  return rows;
}

async function findDoctorAppointments(doctorId) {
  const [rows] = await db.execute(`
    SELECT 
      a.*,
      p.nombre AS paciente_nombre,
      p.apellidos AS paciente_apellidos,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre
    FROM appointments a
    INNER JOIN users p ON p.id = a.paciente_id
    INNER JOIN specialties s ON s.id = a.specialty_id
    INNER JOIN consultorios c ON c.id = a.consultorio_id
    WHERE a.doctor_id = ?
    ORDER BY a.fecha ASC, a.hora_inicio ASC
  `, [doctorId]);

  return rows;
}

async function findAllAppointments(filters = {}) {
  let sql = `
    SELECT 
      a.*,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre,
      p.nombre AS paciente_nombre,
      p.apellidos AS paciente_apellidos,
      du.nombre AS doctor_nombre,
      du.apellidos AS doctor_apellidos
    FROM appointments a
    INNER JOIN specialties s ON s.id = a.specialty_id
    INNER JOIN consultorios c ON c.id = a.consultorio_id
    INNER JOIN users p ON p.id = a.paciente_id
    INNER JOIN doctors d ON d.id = a.doctor_id
    INNER JOIN users du ON du.id = d.user_id
    WHERE 1 = 1
  `;

  const params = [];

  if (filters.estado) {
    sql += ' AND a.estado = ?';
    params.push(filters.estado);
  }

  if (filters.fecha) {
    sql += ' AND a.fecha = ?';
    params.push(filters.fecha);
  }

  sql += ' ORDER BY a.fecha DESC, a.hora_inicio DESC';

  const [rows] = await db.execute(sql, params);
  return rows;
}

module.exports = {
  findDoctorAppointmentsByDate,
  findPatientDuplicate,
  createAppointment,
  findAppointmentById,
  updateAppointmentStatus,
  findMyAppointments,
  findDoctorAppointments,
  findAllAppointments,
};
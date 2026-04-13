const db = require('../config/db');

async function getPatientDashboard(patientId) {
  const [[totals]] = await db.execute(
    `
      SELECT
        COUNT(*) AS total_citas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM appointments
      WHERE patient_id = ?
    `,
    [Number(patientId)]
  );

  const [nextAppointmentRows] = await db.execute(
    `
      SELECT
        a.id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado,
        a.motivo_consulta,
        u.nombre AS doctor_nombre,
        u.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM appointments a
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN specialties s ON s.id = a.specialty_id
      INNER JOIN consultorios c ON c.id = a.consultorio_id
      WHERE a.patient_id = ?
        AND a.estado IN ('pendiente', 'confirmada')
        AND (
          a.fecha > CURDATE()
          OR (a.fecha = CURDATE() AND a.hora_inicio >= CURTIME())
        )
      ORDER BY a.fecha ASC, a.hora_inicio ASC
      LIMIT 1
    `,
    [Number(patientId)]
  );

  const [recentAppointments] = await db.execute(
    `
      SELECT
        a.id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado,
        a.motivo_consulta,
        u.nombre AS doctor_nombre,
        u.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM appointments a
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN specialties s ON s.id = a.specialty_id
      INNER JOIN consultorios c ON c.id = a.consultorio_id
      WHERE a.patient_id = ?
      ORDER BY a.fecha DESC, a.hora_inicio DESC
      LIMIT 5
    `,
    [Number(patientId)]
  );

  return {
    totals: {
      total_citas: Number(totals.total_citas || 0),
      pendientes: Number(totals.pendientes || 0),
      confirmadas: Number(totals.confirmadas || 0),
      atendidas: Number(totals.atendidas || 0),
      canceladas: Number(totals.canceladas || 0),
    },
    next_appointment: nextAppointmentRows[0] || null,
    recent_appointments: recentAppointments,
  };
}

async function getDoctorDashboard(doctorId) {
  const [[totals]] = await db.execute(
    `
      SELECT
        COUNT(*) AS total_citas,
        SUM(CASE WHEN fecha = CURDATE() THEN 1 ELSE 0 END) AS citas_hoy,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM appointments
      WHERE doctor_id = ?
    `,
    [Number(doctorId)]
  );

  const [todayAppointments] = await db.execute(
    `
      SELECT
        a.id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado,
        a.motivo_consulta,
        u.nombre AS paciente_nombre,
        u.apellidos AS paciente_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM appointments a
      INNER JOIN users u ON u.id = a.patient_id
      INNER JOIN specialties s ON s.id = a.specialty_id
      INNER JOIN consultorios c ON c.id = a.consultorio_id
      WHERE a.doctor_id = ?
        AND a.fecha = CURDATE()
      ORDER BY a.hora_inicio ASC
      LIMIT 8
    `,
    [Number(doctorId)]
  );

  const [upcomingAppointments] = await db.execute(
    `
      SELECT
        a.id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado,
        a.motivo_consulta,
        u.nombre AS paciente_nombre,
        u.apellidos AS paciente_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM appointments a
      INNER JOIN users u ON u.id = a.patient_id
      INNER JOIN specialties s ON s.id = a.specialty_id
      INNER JOIN consultorios c ON c.id = a.consultorio_id
      WHERE a.doctor_id = ?
        AND a.estado IN ('pendiente', 'confirmada')
        AND (
          a.fecha > CURDATE()
          OR (a.fecha = CURDATE() AND a.hora_inicio >= CURTIME())
        )
      ORDER BY a.fecha ASC, a.hora_inicio ASC
      LIMIT 5
    `,
    [Number(doctorId)]
  );

  return {
    totals: {
      total_citas: Number(totals.total_citas || 0),
      citas_hoy: Number(totals.citas_hoy || 0),
      pendientes: Number(totals.pendientes || 0),
      confirmadas: Number(totals.confirmadas || 0),
      atendidas: Number(totals.atendidas || 0),
      canceladas: Number(totals.canceladas || 0),
    },
    today_appointments: todayAppointments,
    upcoming_appointments: upcomingAppointments,
  };
}

async function getAdminDashboard() {
  const [[totals]] = await db.execute(
    `
      SELECT
        COUNT(*) AS total_citas,
        SUM(CASE WHEN fecha = CURDATE() THEN 1 ELSE 0 END) AS citas_hoy,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM appointments
    `
  );

  const [[catalogStats]] = await db.execute(
    `
      SELECT
        (SELECT COUNT(*) FROM doctors d INNER JOIN users u ON u.id = d.user_id WHERE d.activo = 1 AND u.activo = 1) AS medicos_activos,
        (SELECT COUNT(*) FROM consultorios WHERE activo = 1) AS consultorios_activos,
        (SELECT COUNT(*) FROM specialties WHERE activo = 1) AS especialidades_activas
    `
  );

  const [recentAppointments] = await db.execute(
    `
      SELECT
        a.id,
        a.fecha,
        a.hora_inicio,
        a.hora_fin,
        a.estado,
        pu.nombre AS paciente_nombre,
        pu.apellidos AS paciente_apellidos,
        du.nombre AS doctor_nombre,
        du.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM appointments a
      INNER JOIN users pu ON pu.id = a.patient_id
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      INNER JOIN specialties s ON s.id = a.specialty_id
      INNER JOIN consultorios c ON c.id = a.consultorio_id
      ORDER BY a.created_at DESC
      LIMIT 8
    `
  );

  return {
    totals: {
      total_citas: Number(totals.total_citas || 0),
      citas_hoy: Number(totals.citas_hoy || 0),
      pendientes: Number(totals.pendientes || 0),
      confirmadas: Number(totals.confirmadas || 0),
      atendidas: Number(totals.atendidas || 0),
      canceladas: Number(totals.canceladas || 0),
    },
    catalog_stats: {
      medicos_activos: Number(catalogStats.medicos_activos || 0),
      consultorios_activos: Number(catalogStats.consultorios_activos || 0),
      especialidades_activas: Number(catalogStats.especialidades_activas || 0),
    },
    recent_appointments: recentAppointments,
  };
}

module.exports = {
  getPatientDashboard,
  getDoctorDashboard,
  getAdminDashboard,
};
const db = require('../config/db');

function buildDateFilter(filters = {}, alias = 'a') {
  const where = [];
  const params = [];

  if (filters.startDate) {
    where.push(`${alias}.fecha >= ?`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    where.push(`${alias}.fecha <= ?`);
    params.push(filters.endDate);
  }

  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

async function getSummary(filters = {}) {
  const { sql, params } = buildDateFilter(filters);
  const [[row]] = await db.execute(
    `
      SELECT
        COUNT(*) AS total_citas,
        SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN a.estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN a.estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN a.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
        ROUND(
          IF(COUNT(*) = 0, 0,
            (SUM(CASE WHEN a.estado = 'cancelada' THEN 1 ELSE 0 END) / COUNT(*)) * 100
          ),
          2
        ) AS porcentaje_cancelacion
      FROM appointments a
      ${sql}
    `,
    params
  );

  const [[topSpecialty]] = await db.execute(
    `
      SELECT s.id, s.nombre, COUNT(*) AS total
      FROM appointments a
      INNER JOIN specialties s ON s.id = a.specialty_id
      ${sql}
      GROUP BY s.id, s.nombre
      ORDER BY total DESC, s.nombre ASC
      LIMIT 1
    `,
    params
  );

  const [[topDoctor]] = await db.execute(
    `
      SELECT d.id, u.nombre, u.apellidos, COUNT(*) AS total_atendidas
      FROM appointments a
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      ${sql ? `${sql} AND a.estado = 'atendida'` : `WHERE a.estado = 'atendida'`}
      GROUP BY d.id, u.nombre, u.apellidos
      ORDER BY total_atendidas DESC, u.nombre ASC
      LIMIT 1
    `,
    params
  );

  return {
    total_citas: Number(row.total_citas || 0),
    pendientes: Number(row.pendientes || 0),
    confirmadas: Number(row.confirmadas || 0),
    atendidas: Number(row.atendidas || 0),
    canceladas: Number(row.canceladas || 0),
    porcentaje_cancelacion: Number(row.porcentaje_cancelacion || 0),
    especialidad_mas_solicitada: topSpecialty
      ? { ...topSpecialty, total: Number(topSpecialty.total || 0) }
      : null,
    medico_con_mas_citas_atendidas: topDoctor
      ? { ...topDoctor, total_atendidas: Number(topDoctor.total_atendidas || 0) }
      : null,
  };
}

async function getAppointmentsBySpecialty(filters = {}) {
  const { sql, params } = buildDateFilter(filters);
  const [rows] = await db.execute(
    `
      SELECT
        s.id AS specialty_id,
        s.nombre AS specialty_nombre,
        COUNT(*) AS total,
        SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN a.estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN a.estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN a.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM appointments a
      INNER JOIN specialties s ON s.id = a.specialty_id
      ${sql}
      GROUP BY s.id, s.nombre
      ORDER BY total DESC, s.nombre ASC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    total: Number(row.total || 0),
    pendientes: Number(row.pendientes || 0),
    confirmadas: Number(row.confirmadas || 0),
    atendidas: Number(row.atendidas || 0),
    canceladas: Number(row.canceladas || 0),
  }));
}

async function getAppointmentsByDoctor(filters = {}) {
  const { sql, params } = buildDateFilter(filters);
  const [rows] = await db.execute(
    `
      SELECT
        d.id AS doctor_id,
        u.nombre AS doctor_nombre,
        u.apellidos AS doctor_apellidos,
        s.nombre AS specialty_nombre,
        COUNT(*) AS total,
        SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN a.estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN a.estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN a.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM appointments a
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users u ON u.id = d.user_id
      LEFT JOIN specialties s ON s.id = d.specialty_id
      ${sql}
      GROUP BY d.id, u.nombre, u.apellidos, s.nombre
      ORDER BY total DESC, u.nombre ASC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    total: Number(row.total || 0),
    pendientes: Number(row.pendientes || 0),
    confirmadas: Number(row.confirmadas || 0),
    atendidas: Number(row.atendidas || 0),
    canceladas: Number(row.canceladas || 0),
  }));
}

async function getAppointmentsByMonth(filters = {}) {
  const { sql, params } = buildDateFilter(filters);
  const [rows] = await db.execute(
    `
      SELECT
        DATE_FORMAT(a.fecha, '%Y-%m') AS month,
        COUNT(*) AS total,
        SUM(CASE WHEN a.estado = 'atendida' THEN 1 ELSE 0 END) AS atendidas,
        SUM(CASE WHEN a.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM appointments a
      ${sql}
      GROUP BY DATE_FORMAT(a.fecha, '%Y-%m')
      ORDER BY month ASC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    total: Number(row.total || 0),
    atendidas: Number(row.atendidas || 0),
    canceladas: Number(row.canceladas || 0),
  }));
}

async function getCancellationRate(filters = {}) {
  const summary = await getSummary(filters);
  return {
    total_citas: summary.total_citas,
    canceladas: summary.canceladas,
    porcentaje_cancelacion: summary.porcentaje_cancelacion,
  };
}

module.exports = {
  getSummary,
  getAppointmentsBySpecialty,
  getAppointmentsByDoctor,
  getAppointmentsByMonth,
  getCancellationRate,
};

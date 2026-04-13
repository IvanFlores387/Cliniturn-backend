const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function findAll({
  search = '',
  specialty_id = '',
  consultorio_id = '',
  activo = '',
} = {}) {
  let sql = `
    SELECT
      d.id,
      d.user_id,
      d.specialty_id,
      d.consultorio_id,
      d.duracion_cita_minutos,
      d.activo,
      d.created_at,
      d.updated_at,
      u.nombre,
      u.apellidos,
      u.email,
      u.activo AS user_activo,
      s.nombre AS specialty_nombre,
      c.nombre AS consultorio_nombre
    FROM doctors d
    INNER JOIN users u ON u.id = d.user_id
    INNER JOIN specialties s ON s.id = d.specialty_id
    INNER JOIN consultorios c ON c.id = d.consultorio_id
    WHERE u.role = 'medico'
  `;

  const params = [];

  if (search?.trim()) {
    sql += `
      AND (
        u.nombre LIKE ?
        OR u.apellidos LIKE ?
        OR u.email LIKE ?
        OR s.nombre LIKE ?
        OR c.nombre LIKE ?
      )
    `;
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (specialty_id !== '' && specialty_id !== undefined && specialty_id !== null) {
    sql += ` AND d.specialty_id = ?`;
    params.push(Number(specialty_id));
  }

  if (consultorio_id !== '' && consultorio_id !== undefined && consultorio_id !== null) {
    sql += ` AND d.consultorio_id = ?`;
    params.push(Number(consultorio_id));
  }

  if (activo !== '' && activo !== undefined && activo !== null) {
    sql += ` AND d.activo = ?`;
    params.push(Number(activo));
  }

  sql += ` ORDER BY u.nombre ASC, u.apellidos ASC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await db.execute(
    `
      SELECT
        d.id,
        d.user_id,
        d.specialty_id,
        d.consultorio_id,
        d.duracion_cita_minutos,
        d.activo,
        d.created_at,
        d.updated_at,
        u.nombre,
        u.apellidos,
        u.email,
        u.activo AS user_activo,
        s.nombre AS specialty_nombre,
        c.nombre AS consultorio_nombre
      FROM doctors d
      INNER JOIN users u ON u.id = d.user_id
      INNER JOIN specialties s ON s.id = d.specialty_id
      INNER JOIN consultorios c ON c.id = d.consultorio_id
      WHERE d.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
}

async function findUserByEmail(email, excludeUserId = null) {
  let sql = `
    SELECT id, email
    FROM users
    WHERE LOWER(email) = LOWER(?)
  `;
  const params = [email.trim()];

  if (excludeUserId) {
    sql += ` AND id <> ?`;
    params.push(Number(excludeUserId));
  }

  sql += ` LIMIT 1`;

  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
}

async function specialtyExists(id) {
  const [rows] = await db.execute(
    `
      SELECT id
      FROM specialties
      WHERE id = ? AND activo = 1
      LIMIT 1
    `,
    [Number(id)]
  );

  return !!rows[0];
}

async function consultorioExists(id) {
  const [rows] = await db.execute(
    `
      SELECT id
      FROM consultorios
      WHERE id = ? AND activo = 1
      LIMIT 1
    `,
    [Number(id)]
  );

  return !!rows[0];
}

async function create({
  nombre,
  apellidos,
  email,
  password,
  specialty_id,
  consultorio_id,
  duracion_cita_minutos = 30,
  activo = 1,
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.execute(
      `
        INSERT INTO users (
          nombre,
          apellidos,
          email,
          password,
          role,
          activo,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 'medico', ?, NOW(), NOW())
      `,
      [
        nombre.trim(),
        apellidos.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        Number(activo),
      ]
    );

    const userId = userResult.insertId;

    const [doctorResult] = await connection.execute(
      `
        INSERT INTO doctors (
          user_id,
          specialty_id,
          consultorio_id,
          duracion_cita_minutos,
          activo,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        Number(userId),
        Number(specialty_id),
        Number(consultorio_id),
        Number(duracion_cita_minutos),
        Number(activo),
      ]
    );

    await connection.commit();

    return await findById(doctorResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(
  id,
  {
    nombre,
    apellidos,
    email,
    specialty_id,
    consultorio_id,
    duracion_cita_minutos = 30,
    activo = 1,
  }
) {
  const existing = await findById(id);

  if (!existing) {
    return null;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE users
        SET
          nombre = ?,
          apellidos = ?,
          email = ?,
          activo = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        nombre.trim(),
        apellidos.trim(),
        email.trim().toLowerCase(),
        Number(activo),
        Number(existing.user_id),
      ]
    );

    await connection.execute(
      `
        UPDATE doctors
        SET
          specialty_id = ?,
          consultorio_id = ?,
          duracion_cita_minutos = ?,
          activo = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        Number(specialty_id),
        Number(consultorio_id),
        Number(duracion_cita_minutos),
        Number(activo),
        Number(id),
      ]
    );

    await connection.commit();

    return await findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function toggleStatus(id, activo) {
  const existing = await findById(id);

  if (!existing) {
    return null;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE doctors
        SET
          activo = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [Number(activo), Number(id)]
    );

    await connection.execute(
      `
        UPDATE users
        SET
          activo = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [Number(activo), Number(existing.user_id)]
    );

    await connection.commit();

    return await findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAll,
  findById,
  findUserByEmail,
  specialtyExists,
  consultorioExists,
  create,
  update,
  toggleStatus,
};
const db = require('../config/db');

async function findAll({ search = '', activo = '' } = {}) {
  let sql = `
    SELECT
      c.id,
      c.nombre,
      c.ubicacion,
      c.piso AS descripcion,
      c.piso,
      c.activo,
      c.created_at,
      c.updated_at,
      (
        SELECT COUNT(*)
        FROM doctors d
        WHERE d.consultorio_id = c.id
      ) AS total_medicos
    FROM consultorios c
    WHERE 1 = 1
  `;

  const params = [];

  if (search?.trim()) {
    sql += `
      AND (
        c.nombre LIKE ?
        OR c.ubicacion LIKE ?
        OR c.piso LIKE ?
      )
    `;
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (activo !== '' && activo !== undefined && activo !== null) {
    sql += ` AND c.activo = ?`;
    params.push(Number(activo));
  }

  sql += ` ORDER BY c.nombre ASC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await db.execute(
    `
      SELECT
        c.id,
        c.nombre,
        c.ubicacion,
        c.piso AS descripcion,
        c.piso,
        c.activo,
        c.created_at,
        c.updated_at
      FROM consultorios c
      WHERE c.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows[0] || null;
}

async function findByName(nombre, excludeId = null) {
  let sql = `
    SELECT id, nombre
    FROM consultorios
    WHERE LOWER(nombre) = LOWER(?)
  `;
  const params = [nombre.trim()];

  if (excludeId) {
    sql += ` AND id <> ?`;
    params.push(Number(excludeId));
  }

  sql += ` LIMIT 1`;

  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
}

async function create({ nombre, ubicacion = null, descripcion = null, activo = 1 }) {
  const [result] = await db.execute(
    `
      INSERT INTO consultorios (
        nombre,
        ubicacion,
        piso,
        activo,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `,
    [
      nombre.trim(),
      ubicacion?.trim() || null,
      descripcion?.trim() || null,
      Number(activo),
    ]
  );

  return findById(result.insertId);
}

async function update(id, { nombre, ubicacion = null, descripcion = null, activo = 1 }) {
  await db.execute(
    `
      UPDATE consultorios
      SET
        nombre = ?,
        ubicacion = ?,
        piso = ?,
        activo = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
    [
      nombre.trim(),
      ubicacion?.trim() || null,
      descripcion?.trim() || null,
      Number(activo),
      Number(id),
    ]
  );

  return findById(id);
}

async function toggleStatus(id, activo) {
  await db.execute(
    `
      UPDATE consultorios
      SET
        activo = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
    [Number(activo), Number(id)]
  );

  return findById(id);
}

module.exports = {
  findAll,
  findById,
  findByName,
  create,
  update,
  toggleStatus,
};
const consultoriosRepository = require('../repositories/consultorios.repository');
const { ok, fail } = require('../utils/api-response');

async function getAll(req, res) {
  try {
    const data = await consultoriosRepository.findAll({
      search: req.query.search || '',
      activo: req.query.activo ?? '',
    });

    return ok(res, data, 'Consultorios obtenidos correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const consultorio = await consultoriosRepository.findById(req.params.id);

    if (!consultorio) {
      return fail(res, 'Consultorio no encontrado.', 404);
    }

    return ok(res, consultorio, 'Consultorio obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const exists = await consultoriosRepository.findByName(req.body.nombre);

    if (exists) {
      return fail(res, 'Ya existe un consultorio con ese nombre.', 400);
    }

    const data = await consultoriosRepository.create({
      nombre: req.body.nombre,
      ubicacion: req.body.ubicacion,
      descripcion: req.body.descripcion,
      activo: req.body.activo ?? 1,
    });

    return ok(res, data, 'Consultorio creado correctamente.', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const existing = await consultoriosRepository.findById(req.params.id);

    if (!existing) {
      return fail(res, 'Consultorio no encontrado.', 404);
    }

    const duplicated = await consultoriosRepository.findByName(
      req.body.nombre,
      req.params.id
    );

    if (duplicated) {
      return fail(res, 'Ya existe otro consultorio con ese nombre.', 400);
    }

    const data = await consultoriosRepository.update(req.params.id, {
      nombre: req.body.nombre,
      ubicacion: req.body.ubicacion,
      descripcion: req.body.descripcion,
      activo: req.body.activo ?? existing.activo,
    });

    return ok(res, data, 'Consultorio actualizado correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function toggleStatus(req, res) {
  try {
    const existing = await consultoriosRepository.findById(req.params.id);

    if (!existing) {
      return fail(res, 'Consultorio no encontrado.', 404);
    }

    const data = await consultoriosRepository.toggleStatus(
      req.params.id,
      req.body.activo
    );

    return ok(
      res,
      data,
      Number(req.body.activo) === 1
        ? 'Consultorio activado correctamente.'
        : 'Consultorio desactivado correctamente.'
    );
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  toggleStatus,
};
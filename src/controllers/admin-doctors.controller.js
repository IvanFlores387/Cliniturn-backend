const repository = require('../repositories/admin-doctors.repository');
const { ok, fail } = require('../utils/api-response');

async function getAll(req, res) {
  try {
    const data = await repository.findAll({
      search: req.query.search || '',
      specialty_id: req.query.specialty_id ?? '',
      consultorio_id: req.query.consultorio_id ?? '',
      activo: req.query.activo ?? '',
    });

    return ok(res, data, 'Médicos obtenidos correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const doctor = await repository.findById(req.params.id);

    if (!doctor) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    return ok(res, doctor, 'Médico obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const emailExists = await repository.findUserByEmail(req.body.email);

    if (emailExists) {
      return fail(res, 'Ya existe un usuario con ese correo electrónico.', 400);
    }

    const specialtyExists = await repository.specialtyExists(req.body.specialty_id);
    if (!specialtyExists) {
      return fail(res, 'La especialidad seleccionada no existe o está inactiva.', 400);
    }

    const consultorioExists = await repository.consultorioExists(req.body.consultorio_id);
    if (!consultorioExists) {
      return fail(res, 'El consultorio seleccionado no existe o está inactivo.', 400);
    }

    const data = await repository.create({
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      email: req.body.email,
      password: req.body.password,
      specialty_id: req.body.specialty_id,
      consultorio_id: req.body.consultorio_id,
      duracion_cita_minutos: req.body.duracion_cita_minutos,
      activo: req.body.activo ?? 1,
    });

    return ok(res, data, 'Médico creado correctamente.', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const existing = await repository.findById(req.params.id);

    if (!existing) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    const emailExists = await repository.findUserByEmail(
      req.body.email,
      existing.user_id
    );

    if (emailExists) {
      return fail(res, 'Ya existe otro usuario con ese correo electrónico.', 400);
    }

    const specialtyExists = await repository.specialtyExists(req.body.specialty_id);
    if (!specialtyExists) {
      return fail(res, 'La especialidad seleccionada no existe o está inactiva.', 400);
    }

    const consultorioExists = await repository.consultorioExists(req.body.consultorio_id);
    if (!consultorioExists) {
      return fail(res, 'El consultorio seleccionado no existe o está inactivo.', 400);
    }

    const data = await repository.update(req.params.id, {
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      email: req.body.email,
      specialty_id: req.body.specialty_id,
      consultorio_id: req.body.consultorio_id,
      duracion_cita_minutos: req.body.duracion_cita_minutos,
      activo: req.body.activo ?? existing.activo,
    });

    return ok(res, data, 'Médico actualizado correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function toggleStatus(req, res) {
  try {
    const existing = await repository.findById(req.params.id);

    if (!existing) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    const data = await repository.toggleStatus(req.params.id, req.body.activo);

    return ok(
      res,
      data,
      Number(req.body.activo) === 1
        ? 'Médico activado correctamente.'
        : 'Médico desactivado correctamente.'
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
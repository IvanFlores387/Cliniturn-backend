const repository = require('../repositories/admin-doctor-schedules.repository');
const { ok, fail } = require('../utils/api-response');

function doctorIsActive(doctor) {
  return Number(doctor.activo) === 1 && Number(doctor.user_activo) === 1;
}

async function getAll(req, res) {
  try {
    const doctor = await repository.doctorExists(req.params.doctorId);

    if (!doctor) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    const data = await repository.findAllByDoctor(req.params.doctorId);

    return ok(
      res,
      {
        doctor: {
          id: doctor.id,
          nombre: doctor.nombre,
          apellidos: doctor.apellidos,
        },
        schedules: data,
      },
      'Horarios obtenidos correctamente.'
    );
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const doctor = await repository.doctorExists(req.params.doctorId);

    if (!doctor) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    if (!doctorIsActive(doctor)) {
      return fail(res, 'No se pueden asignar horarios a un médico inactivo.', 400);
    }

    const overlap = await repository.hasOverlap({
      doctor_id: req.params.doctorId,
      dia_semana: req.body.dia_semana,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
    });

    if (overlap) {
      return fail(
        res,
        'Ya existe un horario traslapado para ese médico en el mismo día.',
        400
      );
    }

    const data = await repository.create({
      doctor_id: req.params.doctorId,
      dia_semana: req.body.dia_semana,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      activo: req.body.activo ?? 1,
    });

    return ok(res, data, 'Horario creado correctamente.', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const doctor = await repository.doctorExists(req.params.doctorId);

    if (!doctor) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    const existing = await repository.findById(req.params.scheduleId);

    if (!existing || Number(existing.doctor_id) !== Number(req.params.doctorId)) {
      return fail(res, 'Horario no encontrado para ese médico.', 404);
    }

    const overlap = await repository.hasOverlap({
      doctor_id: req.params.doctorId,
      dia_semana: req.body.dia_semana,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      excludeScheduleId: req.params.scheduleId,
    });

    if (overlap) {
      return fail(
        res,
        'Ya existe un horario traslapado para ese médico en el mismo día.',
        400
      );
    }

    const data = await repository.update(req.params.scheduleId, {
      dia_semana: req.body.dia_semana,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      activo: req.body.activo ?? existing.activo,
    });

    return ok(res, data, 'Horario actualizado correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const doctor = await repository.doctorExists(req.params.doctorId);

    if (!doctor) {
      return fail(res, 'Médico no encontrado.', 404);
    }

    const existing = await repository.findById(req.params.scheduleId);

    if (!existing || Number(existing.doctor_id) !== Number(req.params.doctorId)) {
      return fail(res, 'Horario no encontrado para ese médico.', 404);
    }

    await repository.remove(req.params.scheduleId);

    return ok(res, null, 'Horario eliminado correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove,
};
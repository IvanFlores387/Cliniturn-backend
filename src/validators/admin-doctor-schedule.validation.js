function isValidTimeFormat(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(String(value));
}

function normalizeTime(value) {
  const str = String(value);
  return str.length === 5 ? `${str}:00` : str;
}

function isEndAfterStart(start, end) {
  return normalizeTime(end) > normalizeTime(start);
}

function validateDoctorId(req, res, next) {
  const { doctorId } = req.params;

  if (!doctorId || Number.isNaN(Number(doctorId))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del médico es inválido.',
    });
  }

  next();
}

function validateCreateSchedule(req, res, next) {
  const { dia_semana, hora_inicio, hora_fin, activo } = req.body;

  if (dia_semana === undefined || dia_semana === null || Number.isNaN(Number(dia_semana))) {
    return res.status(400).json({
      ok: false,
      message: 'El día de la semana es obligatorio.',
    });
  }

  const dia = Number(dia_semana);
  if (dia < 0 || dia > 6) {
    return res.status(400).json({
      ok: false,
      message: 'El día de la semana debe estar entre 0 y 6.',
    });
  }

  if (!hora_inicio || !isValidTimeFormat(hora_inicio)) {
    return res.status(400).json({
      ok: false,
      message: 'La hora de inicio es obligatoria y debe tener formato HH:mm o HH:mm:ss.',
    });
  }

  if (!hora_fin || !isValidTimeFormat(hora_fin)) {
    return res.status(400).json({
      ok: false,
      message: 'La hora de fin es obligatoria y debe tener formato HH:mm o HH:mm:ss.',
    });
  }

  if (!isEndAfterStart(hora_inicio, hora_fin)) {
    return res.status(400).json({
      ok: false,
      message: 'La hora de fin debe ser mayor a la hora de inicio.',
    });
  }

  if (activo !== undefined && ![0, 1, '0', '1', true, false].includes(activo)) {
    return res.status(400).json({
      ok: false,
      message: 'El estado activo debe ser 0 o 1.',
    });
  }

  req.body.hora_inicio = normalizeTime(hora_inicio);
  req.body.hora_fin = normalizeTime(hora_fin);

  next();
}

function validateUpdateSchedule(req, res, next) {
  const { scheduleId } = req.params;

  if (!scheduleId || Number.isNaN(Number(scheduleId))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del horario es inválido.',
    });
  }

  return validateCreateSchedule(req, res, next);
}

function validateDeleteSchedule(req, res, next) {
  const { doctorId, scheduleId } = req.params;

  if (!doctorId || Number.isNaN(Number(doctorId))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del médico es inválido.',
    });
  }

  if (!scheduleId || Number.isNaN(Number(scheduleId))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del horario es inválido.',
    });
  }

  next();
}

module.exports = {
  validateDoctorId,
  validateCreateSchedule,
  validateUpdateSchedule,
  validateDeleteSchedule,
};
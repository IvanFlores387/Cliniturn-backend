function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function fail(res, message) {
  return res.status(400).json({ ok: false, message });
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(clean(value));
}

function normalizeTime(value) {
  const time = clean(value);
  return time.length === 5 ? `${time}:00` : time;
}

function timeToMinutes(value) {
  const [hours, minutes] = normalizeTime(value).split(':').map(Number);
  return hours * 60 + minutes;
}

function isEndAfterStart(start, end) {
  return timeToMinutes(end) > timeToMinutes(start);
}

function isValidDate(value) {
  const date = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;

  const [year, month, day] = date.split('-').map(Number);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day
  );
}

function validateCreateAppointment(req, res, next) {
  const doctorId = Number(req.body.doctor_id);
  const fecha = clean(req.body.fecha);
  const horaInicio = normalizeTime(req.body.hora_inicio);
  const horaFin = normalizeTime(req.body.hora_fin);
  const motivo = clean(req.body.motivo_consulta);

  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    return fail(res, 'El médico seleccionado no es válido.');
  }

  if (!isValidDate(fecha)) {
    return fail(res, 'La fecha debe tener formato YYYY-MM-DD y ser válida.');
  }

  if (!isValidTime(horaInicio)) {
    return fail(res, 'La hora de inicio debe tener formato HH:mm o HH:mm:ss.');
  }

  if (!isValidTime(horaFin)) {
    return fail(res, 'La hora de fin debe tener formato HH:mm o HH:mm:ss.');
  }

  if (!isEndAfterStart(horaInicio, horaFin)) {
    return fail(res, 'La hora de fin debe ser mayor a la hora de inicio.');
  }

  if (!motivo) {
    return fail(res, 'El motivo de consulta es obligatorio.');
  }

  if (motivo.length < 5 || motivo.length > 255) {
    return fail(res, 'El motivo de consulta debe tener entre 5 y 255 caracteres.');
  }

  req.body.doctor_id = doctorId;
  req.body.fecha = fecha;
  req.body.hora_inicio = horaInicio;
  req.body.hora_fin = horaFin;
  req.body.motivo_consulta = motivo;

  next();
}

module.exports = {
  validateCreateAppointment,
};

function clean(value) {
  return value === undefined || value === null
    ? ''
    : String(value).trim();
}

function fail(res, message) {
  return res.status(400).json({
    ok: false,
    message,
  });
}

function isValidTime(value) {
  const time = clean(value);

  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time);
}

function normalizeTime(value) {
  const time = clean(value);

  return time.length === 5 ? `${time}:00` : time;
}

function timeToSeconds(value) {
  const [hours, minutes, seconds = 0] = normalizeTime(value)
    .split(':')
    .map(Number);

  return hours * 3600 + minutes * 60 + seconds;
}

function isEndAfterStart(start, end) {
  return timeToSeconds(end) > timeToSeconds(start);
}

function isValidDate(value) {
  const date = clean(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() + 1 === month &&
    parsedDate.getDate() === day
  );
}

function validateCreateAppointment(req, res, next) {
  const {
    doctor_id,
    fecha,
    hora_inicio,
    hora_fin,
    motivo_consulta,
  } = req.body;

  const doctorId = Number(doctor_id);
  const cleanFecha = clean(fecha);
  const horaInicio = normalizeTime(hora_inicio);
  const horaFin = normalizeTime(hora_fin);
  const motivoConsulta = clean(motivo_consulta);

  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    return fail(
      res,
      'doctor_id debe ser un número entero positivo.'
    );
  }

  if (!isValidDate(cleanFecha)) {
    return fail(
      res,
      'fecha debe tener formato YYYY-MM-DD y representar una fecha válida.'
    );
  }

  if (!isValidTime(horaInicio)) {
    return fail(
      res,
      'hora_inicio debe tener formato HH:mm o HH:mm:ss.'
    );
  }

  if (!isValidTime(horaFin)) {
    return fail(
      res,
      'hora_fin debe tener formato HH:mm o HH:mm:ss.'
    );
  }

  if (!isEndAfterStart(horaInicio, horaFin)) {
    return fail(
      res,
      'hora_inicio debe ser menor que hora_fin.'
    );
  }

  if (!motivoConsulta) {
    return fail(
      res,
      'motivo_consulta es obligatorio.'
    );
  }

  if (motivoConsulta.length < 5) {
    return fail(
      res,
      'motivo_consulta debe tener al menos 5 caracteres.'
    );
  }

  if (motivoConsulta.length > 255) {
    return fail(
      res,
      'motivo_consulta no puede tener más de 255 caracteres.'
    );
  }

  req.body.doctor_id = doctorId;
  req.body.fecha = cleanFecha;
  req.body.hora_inicio = horaInicio;
  req.body.hora_fin = horaFin;
  req.body.motivo_consulta = motivoConsulta;

  next();
}

module.exports = {
  validateCreateAppointment,
};
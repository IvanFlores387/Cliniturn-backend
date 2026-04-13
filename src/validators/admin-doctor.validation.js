function isValidActivo(value) {
  return [0, 1, '0', '1', true, false].includes(value);
}

function validateBaseDoctorPayload(body, isEdit = false) {
  const {
    nombre,
    apellidos,
    email,
    password,
    specialty_id,
    consultorio_id,
    duracion_cita_minutos,
    activo,
  } = body;

  if (!nombre || !String(nombre).trim()) {
    return 'El nombre es obligatorio.';
  }

  if (String(nombre).trim().length < 2 || String(nombre).trim().length > 80) {
    return 'El nombre debe tener entre 2 y 80 caracteres.';
  }

  if (!apellidos || !String(apellidos).trim()) {
    return 'Los apellidos son obligatorios.';
  }

  if (String(apellidos).trim().length < 2 || String(apellidos).trim().length > 120) {
    return 'Los apellidos deben tener entre 2 y 120 caracteres.';
  }

  if (!email || !String(email).trim()) {
    return 'El correo electrónico es obligatorio.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return 'El correo electrónico no es válido.';
  }

  if (!isEdit) {
    if (!password || !String(password).trim()) {
      return 'La contraseña temporal es obligatoria.';
    }

    if (String(password).trim().length < 6 || String(password).trim().length > 50) {
      return 'La contraseña debe tener entre 6 y 50 caracteres.';
    }
  }

  if (!specialty_id || Number.isNaN(Number(specialty_id))) {
    return 'La especialidad es obligatoria.';
  }

  if (!consultorio_id || Number.isNaN(Number(consultorio_id))) {
    return 'El consultorio es obligatorio.';
  }

  if (
    duracion_cita_minutos === undefined ||
    duracion_cita_minutos === null ||
    Number.isNaN(Number(duracion_cita_minutos))
  ) {
    return 'La duración de la cita es obligatoria.';
  }

  const duracion = Number(duracion_cita_minutos);
  if (duracion < 15 || duracion > 120) {
    return 'La duración de la cita debe estar entre 15 y 120 minutos.';
  }

  if (activo !== undefined && !isValidActivo(activo)) {
    return 'El estado activo debe ser 0 o 1.';
  }

  return null;
}

function validateCreateDoctor(req, res, next) {
  const error = validateBaseDoctorPayload(req.body, false);

  if (error) {
    return res.status(400).json({
      ok: false,
      message: error,
    });
  }

  next();
}

function validateUpdateDoctor(req, res, next) {
  if (!req.params.id || Number.isNaN(Number(req.params.id))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del médico es inválido.',
    });
  }

  const error = validateBaseDoctorPayload(req.body, true);

  if (error) {
    return res.status(400).json({
      ok: false,
      message: error,
    });
  }

  next();
}

function validateToggleDoctor(req, res, next) {
  const { id } = req.params;
  const { activo } = req.body;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del médico es inválido.',
    });
  }

  if (!isValidActivo(activo)) {
    return res.status(400).json({
      ok: false,
      message: 'Debes enviar el estado activo como 0 o 1.',
    });
  }

  next();
}

module.exports = {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateToggleDoctor,
};
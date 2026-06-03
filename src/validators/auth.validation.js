function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
}

function isValidRole(value) {
  return ['paciente', 'medico', 'admin'].includes(clean(value).toLowerCase());
}

function normalizeTextField(req, field) {
  if (req.body[field] !== undefined && req.body[field] !== null) {
    req.body[field] = clean(req.body[field]);
  }
}

function fail(res, message) {
  return res.status(400).json({ ok: false, message });
}

function validateCommonRegisterFields(req, res) {
  const nombre = clean(req.body.nombre);
  const apellidos = clean(req.body.apellidos);
  const email = clean(req.body.email).toLowerCase();
  const password = clean(req.body.password);
  const role = clean(req.body.role).toLowerCase();
  const telefono = clean(req.body.telefono);

  if (!nombre) return fail(res, 'El nombre es obligatorio.');
  if (nombre.length < 2 || nombre.length > 120) {
    return fail(res, 'El nombre debe tener entre 2 y 120 caracteres.');
  }

  if (!apellidos) return fail(res, 'Los apellidos son obligatorios.');
  if (apellidos.length < 2 || apellidos.length > 120) {
    return fail(res, 'Los apellidos deben tener entre 2 y 120 caracteres.');
  }

  if (!email) return fail(res, 'El correo electrónico es obligatorio.');
  if (!isValidEmail(email) || email.length > 150) {
    return fail(res, 'El correo electrónico no es válido.');
  }

  if (!password) return fail(res, 'La contraseña es obligatoria.');
  if (password.length < 6 || password.length > 72) {
    return fail(res, 'La contraseña debe tener entre 6 y 72 caracteres.');
  }

  if (!role) return fail(res, 'El rol es obligatorio.');
  if (!isValidRole(role)) return fail(res, 'Rol no válido.');

  if (telefono && !/^[0-9+()\s.-]{7,20}$/.test(telefono)) {
    return fail(res, 'El teléfono no tiene un formato válido.');
  }

  req.body.nombre = nombre;
  req.body.apellidos = apellidos;
  req.body.email = email;
  req.body.password = password;
  req.body.role = role;
  req.body.telefono = telefono || null;

  return null;
}

function validateRegister(req, res, next) {
  const commonError = validateCommonRegisterFields(req, res);
  if (commonError) return commonError;

  const role = req.body.role;

  normalizeTextField(req, 'matricula');
  normalizeTextField(req, 'carrera');
  normalizeTextField(req, 'cedula');
  normalizeTextField(req, 'especialidad');
  normalizeTextField(req, 'codigoAdmin');

  if (role === 'paciente') {
    if (!req.body.matricula || !req.body.carrera) {
      return fail(res, 'Para paciente debes capturar matrícula y carrera.');
    }

    if (req.body.matricula.length < 3 || req.body.matricula.length > 30) {
      return fail(res, 'La matrícula debe tener entre 3 y 30 caracteres.');
    }

    if (req.body.carrera.length < 3 || req.body.carrera.length > 120) {
      return fail(res, 'La carrera debe tener entre 3 y 120 caracteres.');
    }
  }

  if (role === 'medico') {
    if (!req.body.cedula || !req.body.especialidad) {
      return fail(res, 'Para médico debes capturar cédula y especialidad.');
    }

    if (!/^[A-Za-z0-9-]{4,30}$/.test(req.body.cedula)) {
      return fail(res, 'La cédula debe tener entre 4 y 30 caracteres alfanuméricos.');
    }

    if (req.body.especialidad.length < 3 || req.body.especialidad.length > 100) {
      return fail(res, 'La especialidad debe tener entre 3 y 100 caracteres.');
    }
  }

  if (role === 'admin') {
    if (!req.body.codigoAdmin) {
      return fail(res, 'Para administrador debes capturar el código de administrador.');
    }

    if (req.body.codigoAdmin.length < 4 || req.body.codigoAdmin.length > 40) {
      return fail(res, 'El código de administrador debe tener entre 4 y 40 caracteres.');
    }
  }

  next();
}

function validateLogin(req, res, next) {
  const email = clean(req.body.email).toLowerCase();
  const password = clean(req.body.password);

  if (!email || !password) {
    return fail(res, 'Correo y contraseña son obligatorios.');
  }

  if (!isValidEmail(email)) {
    return fail(res, 'El correo electrónico no es válido.');
  }

  req.body.email = email;
  req.body.password = password;

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
};

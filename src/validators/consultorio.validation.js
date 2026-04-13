function validateCreateConsultorio(req, res, next) {
  const { nombre, ubicacion, descripcion, activo } = req.body;

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({
      ok: false,
      message: 'El nombre del consultorio es obligatorio.',
    });
  }

  if (String(nombre).trim().length < 3 || String(nombre).trim().length > 100) {
    return res.status(400).json({
      ok: false,
      message: 'El nombre debe tener entre 3 y 100 caracteres.',
    });
  }

  if (ubicacion && String(ubicacion).trim().length > 150) {
    return res.status(400).json({
      ok: false,
      message: 'La ubicación no puede exceder los 150 caracteres.',
    });
  }

  if (descripcion && String(descripcion).trim().length > 255) {
    return res.status(400).json({
      ok: false,
      message: 'La descripción no puede exceder los 255 caracteres.',
    });
  }

  if (activo !== undefined && ![0, 1, '0', '1', true, false].includes(activo)) {
    return res.status(400).json({
      ok: false,
      message: 'El campo activo debe ser 0 o 1.',
    });
  }

  next();
}

function validateUpdateConsultorio(req, res, next) {
  const { id } = req.params;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del consultorio es inválido.',
    });
  }

  return validateCreateConsultorio(req, res, next);
}

function validateToggleConsultorio(req, res, next) {
  const { id } = req.params;
  const { activo } = req.body;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({
      ok: false,
      message: 'El id del consultorio es inválido.',
    });
  }

  if (![0, 1, '0', '1', true, false].includes(activo)) {
    return res.status(400).json({
      ok: false,
      message: 'Debes enviar el estado activo como 0 o 1.',
    });
  }

  next();
}

module.exports = {
  validateCreateConsultorio,
  validateUpdateConsultorio,
  validateToggleConsultorio,
};
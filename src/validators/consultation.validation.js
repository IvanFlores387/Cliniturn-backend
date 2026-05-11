function cleanText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function validateVitalSigns(value) {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Los signos vitales deben enviarse como objeto JSON.');
  }

  const allowed = ['peso', 'talla', 'presion_arterial', 'temperatura', 'frecuencia_cardiaca', 'frecuencia_respiratoria'];
  const result = {};

  for (const key of allowed) {
    const raw = value[key];
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      result[key] = String(raw).trim();
    }
  }

  return Object.keys(result).length ? result : null;
}

function validateCreateConsultation(req, res, next) {
  try {
    const appointmentId = Number(req.body.appointment_id);
    const diagnosis = cleanText(req.body.diagnosis);
    const treatment = cleanText(req.body.treatment);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ ok: false, message: 'La cita asociada es obligatoria.' });
    }

    if (!diagnosis || diagnosis.length < 3) {
      return res.status(400).json({ ok: false, message: 'El diagnóstico es obligatorio y debe tener al menos 3 caracteres.' });
    }

    if (!treatment || treatment.length < 3) {
      return res.status(400).json({ ok: false, message: 'El tratamiento es obligatorio y debe tener al menos 3 caracteres.' });
    }

    req.body.appointment_id = appointmentId;
    req.body.diagnosis = diagnosis;
    req.body.treatment = treatment;
    req.body.observations = cleanText(req.body.observations) || null;
    req.body.general_indications = cleanText(req.body.general_indications) || null;
    req.body.vital_signs = validateVitalSigns(req.body.vital_signs);

    next();
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
}

function validateUpdateConsultation(req, res, next) {
  try {
    const diagnosis = cleanText(req.body.diagnosis);
    const treatment = cleanText(req.body.treatment);

    if (!diagnosis || diagnosis.length < 3) {
      return res.status(400).json({ ok: false, message: 'El diagnóstico es obligatorio y debe tener al menos 3 caracteres.' });
    }

    if (!treatment || treatment.length < 3) {
      return res.status(400).json({ ok: false, message: 'El tratamiento es obligatorio y debe tener al menos 3 caracteres.' });
    }

    req.body.diagnosis = diagnosis;
    req.body.treatment = treatment;
    req.body.observations = cleanText(req.body.observations) || null;
    req.body.general_indications = cleanText(req.body.general_indications) || null;
    req.body.vital_signs = validateVitalSigns(req.body.vital_signs);

    next();
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
}

module.exports = {
  validateCreateConsultation,
  validateUpdateConsultation,
};

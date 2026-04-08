function validateCreateAppointment(req, res, next) {
  const { doctor_id, fecha, hora_inicio, hora_fin, motivo_consulta } = req.body;

  if (!doctor_id || !fecha || !hora_inicio || !hora_fin || !motivo_consulta?.trim()) {
    return res.status(400).json({
      ok: false,
      message: 'doctor_id, fecha, hora_inicio, hora_fin y motivo_consulta son obligatorios.',
    });
  }

  next();
}

module.exports = {
  validateCreateAppointment,
};
const reportsService = require('../services/reports.service');
const { ok, fail } = require('../utils/api-response');

async function summary(req, res) {
  try {
    const data = await reportsService.getSummary(req.query);
    return ok(res, data, 'Resumen de reportes obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function appointmentsBySpecialty(req, res) {
  try {
    const data = await reportsService.getAppointmentsBySpecialty(req.query);
    return ok(res, data, 'Reporte de citas por especialidad obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function appointmentsByDoctor(req, res) {
  try {
    const data = await reportsService.getAppointmentsByDoctor(req.query);
    return ok(res, data, 'Reporte de citas por médico obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function appointmentsByMonth(req, res) {
  try {
    const data = await reportsService.getAppointmentsByMonth(req.query);
    return ok(res, data, 'Reporte de citas por mes obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function cancellationRate(req, res) {
  try {
    const data = await reportsService.getCancellationRate(req.query);
    return ok(res, data, 'Porcentaje de cancelación obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = {
  summary,
  appointmentsBySpecialty,
  appointmentsByDoctor,
  appointmentsByMonth,
  cancellationRate,
};

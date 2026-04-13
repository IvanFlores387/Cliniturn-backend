const dashboardService = require('../services/dashboard.service');
const { ok, fail } = require('../utils/api-response');

async function patientDashboard(req, res) {
  try {
    const data = await dashboardService.getPatientDashboard(req.user);
    return ok(res, data, 'Dashboard del paciente obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function doctorDashboard(req, res) {
  try {
    const data = await dashboardService.getDoctorDashboard(req.user);
    return ok(res, data, 'Dashboard del médico obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function adminDashboard(req, res) {
  try {
    const data = await dashboardService.getAdminDashboard();
    return ok(res, data, 'Dashboard del administrador obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = {
  patientDashboard,
  doctorDashboard,
  adminDashboard,
};
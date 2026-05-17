const historyService = require('../services/history.service');
const { ok, fail } = require('../utils/api-response');

async function getPatientHistory(req, res) {
  try {
    const data = await historyService.getPatientHistory(req.params.patientId, req.user);
    return ok(res, data, 'Historial médico obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, error.status || 400);
  }
}

async function getMyHistory(req, res) {
  try {
    const data = await historyService.getMyHistory(req.user);
    return ok(res, data, 'Mi historial médico obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, error.status || 400);
  }
}

async function getDoctorPatients(req, res) {
  try {
    const data = await historyService.getDoctorPatients(req.user);
    return ok(res, data, 'Pacientes atendidos obtenidos correctamente.');
  } catch (error) {
    return fail(res, error.message, error.status || 400);
  }
}

module.exports = {
  getPatientHistory,
  getMyHistory,
  getDoctorPatients,
};

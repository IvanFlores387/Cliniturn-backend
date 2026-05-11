const recordsService = require('../services/records.service');
const { ok, fail } = require('../utils/api-response');

async function getAll(req, res) {
  try {
    const data = await recordsService.getRecords(req.query, req.user);
    return ok(res, data, 'Expedientes obtenidos correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const data = await recordsService.getRecordById(req.params.id, req.user);
    return ok(res, data, 'Expediente obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 404);
  }
}

async function getByPatientId(req, res) {
  try {
    const data = await recordsService.getRecordByPatientId(req.params.patientId, req.user);
    return ok(res, data, 'Expediente del paciente obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 404);
  }
}

async function getMy(req, res) {
  try {
    const data = await recordsService.getMyRecord(req.user);
    return ok(res, data, 'Mi expediente obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 404);
  }
}

module.exports = { getAll, getById, getByPatientId, getMy };

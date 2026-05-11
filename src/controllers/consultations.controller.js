const consultationsService = require('../services/consultations.service');
const { ok, fail } = require('../utils/api-response');

async function create(req, res) {
  try {
    const data = await consultationsService.createConsultation(req.body, req.user);
    return ok(res, data, 'Consulta registrada correctamente.', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const data = await consultationsService.getConsultationById(req.params.id, req.user);
    return ok(res, data, 'Consulta obtenida correctamente.');
  } catch (error) {
    return fail(res, error.message, 404);
  }
}

async function getByAppointmentId(req, res) {
  try {
    const data = await consultationsService.getByAppointmentId(req.params.appointmentId, req.user);
    return ok(res, data, 'Consulta de la cita obtenida correctamente.');
  } catch (error) {
    return fail(res, error.message, 404);
  }
}

async function getByPatientId(req, res) {
  try {
    const data = await consultationsService.getByPatientId(req.params.patientId, req.user);
    return ok(res, data, 'Historial clínico obtenido correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const data = await consultationsService.updateConsultation(req.params.id, req.body, req.user);
    return ok(res, data, 'Consulta actualizada correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = { create, getById, getByAppointmentId, getByPatientId, update };

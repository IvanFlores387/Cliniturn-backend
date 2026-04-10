const appointmentsService = require('../services/appointments.service');
const availabilityService = require('../services/availability.service');
const appointmentsRepository = require('../repositories/appointments.repository');
const appointmentsQueryService = require('../services/appointments-query.service');
const { ok, fail } = require('../utils/api-response');

async function getAvailability(req, res) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return fail(res, 'La fecha es obligatoria.', 400);
    }

    const data = await availabilityService.getDoctorAvailability(id, date);
    return ok(res, data, 'Disponibilidad obtenida correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const data = await appointmentsService.createAppointment(req.user, req.body);
    return ok(res, data, 'Cita agendada correctamente.', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function getMy(req, res) {
  try {
    const data = await appointmentsRepository.findMyAppointments(req.user.id);
    return ok(res, data, 'Citas del paciente obtenidas.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function getDoctor(req, res) {
  try {
    const data = await appointmentsRepository.findDoctorAppointments(req.user.doctor_id);
    return ok(res, data, 'Citas del médico obtenidas.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

// 🔥 NUEVA VERSION CON PAGINACION + FILTROS
async function getAll(req, res) {
  try {
    const data = await appointmentsQueryService.getAllAppointments(req.query);
    return ok(res, data, 'Listado de citas obtenido.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function confirm(req, res) {
  try {
    const data = await appointmentsService.confirmAppointment(req.params.id, req.user);
    return ok(res, data, 'Cita confirmada correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function cancel(req, res) {
  try {
    const data = await appointmentsService.cancelAppointment(
      req.params.id,
      req.user,
      req.body?.notas_cancelacion || null
    );
    return ok(res, data, 'Cita cancelada correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function attended(req, res) {
  try {
    const data = await appointmentsService.markAsAttended(req.params.id, req.user);
    return ok(res, data, 'Cita marcada como atendida.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = {
  getAvailability,
  create,
  getMy,
  getDoctor,
  getAll,
  confirm,
  cancel,
  attended,
};
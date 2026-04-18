const appointmentsService = require('../services/appointments.service');
const appointmentsQueryService = require('../services/appointments-query.service');
const { ok, fail } = require('../utils/api-response');

async function create(req, res) {
  try {
    const data = await appointmentsService.createAppointment({
      patient_id: req.user.id,
      doctor_id: req.body.doctor_id,
      fecha: req.body.fecha,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      motivo_consulta: req.body.motivo_consulta,
    });

    return ok(res, data, 'Cita creada correctamente.', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function myAppointments(req, res) {
  try {
    const data = await appointmentsService.getMyAppointments(req.user.id, {
      estado: req.query.estado || '',
      fecha: req.query.fecha || '',
    });

    return ok(res, data, 'Citas del paciente obtenidas correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function doctorAppointments(req, res) {
  try {
    if (!req.user.doctor_id) {
      return fail(res, 'El usuario médico no tiene un doctor_id asociado.', 400);
    }

    const data = await appointmentsService.getDoctorAppointments(req.user.doctor_id, {
      estado: req.query.estado || '',
      fecha: req.query.fecha || '',
    });

    return ok(res, data, 'Citas del médico obtenidas correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function allAppointments(req, res) {
  try {
    const data = await appointmentsQueryService.getAllAppointments(req.query);
    return ok(res, data, 'Citas obtenidas correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function confirmAppointment(req, res) {
  try {
    const data = await appointmentsService.confirmDoctorAppointment(
      req.params.id,
      req.user
    );

    return ok(res, data, 'Cita confirmada correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function cancelAppointment(req, res) {
  try {
    let data;

    if (req.user.role === 'paciente') {
      data = await appointmentsService.cancelMyAppointment(req.params.id, req.user);
    } else {
      data = await appointmentsService.cancelDoctorAppointment(req.params.id, req.user);
    }

    return ok(res, data, 'Cita cancelada correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

async function attendedAppointment(req, res) {
  try {
    const data = await appointmentsService.attendDoctorAppointment(
      req.params.id,
      req.user
    );

    return ok(res, data, 'Cita marcada como atendida correctamente.');
  } catch (error) {
    return fail(res, error.message, 400);
  }
}

module.exports = {
  create,
  myAppointments,
  doctorAppointments,
  allAppointments,
  confirmAppointment,
  cancelAppointment,
  attendedAppointment,

  getMy: myAppointments,
  getDoctor: doctorAppointments,
  getAll: allAppointments,
  confirm: confirmAppointment,
  cancel: cancelAppointment,
  attended: attendedAppointment,
};
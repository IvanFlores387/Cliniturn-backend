const doctorsRepository = require('../repositories/doctors.repository');
const appointmentsRepository = require('../repositories/appointments.repository');
const availabilityService = require('./availability.service');
const { isPastDateTime } = require('../utils/date.utils');

async function createAppointment(authUser, payload) {
  const doctor = await doctorsRepository.findDoctorById(payload.doctor_id);

  if (!doctor || !doctor.activo || !doctor.user_activo) {
    throw new Error('No se puede agendar con un médico inactivo.');
  }

  if (isPastDateTime(payload.fecha, payload.hora_inicio)) {
    throw new Error('No se permiten citas en fechas u horas pasadas.');
  }

  const duplicate = await appointmentsRepository.findPatientDuplicate(
    authUser.id,
    payload.fecha,
    payload.hora_inicio
  );

  if (duplicate) {
    throw new Error('Ya tienes una cita agendada en esa fecha y hora.');
  }

  const availability = await availabilityService.getDoctorAvailability(payload.doctor_id, payload.fecha);

  const validSlot = availability.find(
    slot => slot.hora_inicio === payload.hora_inicio && slot.hora_fin === payload.hora_fin
  );

  if (!validSlot) {
    throw new Error('El horario seleccionado ya no está disponible o no pertenece al horario del médico.');
  }

  const appointmentId = await appointmentsRepository.createAppointment({
    paciente_id: authUser.id,
    doctor_id: payload.doctor_id,
    specialty_id: doctor.specialty_id,
    consultorio_id: doctor.consultorio_id,
    fecha: payload.fecha,
    hora_inicio: payload.hora_inicio,
    hora_fin: payload.hora_fin,
    motivo_consulta: payload.motivo_consulta,
  });

  return appointmentsRepository.findAppointmentById(appointmentId);
}

async function cancelAppointment(appointmentId, authUser, reason = null) {
  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) {
    throw new Error('La cita no existe.');
  }

  if (authUser.role === 'paciente' && appointment.paciente_id !== authUser.id) {
    throw new Error('No puedes cancelar una cita que no te pertenece.');
  }

  if (authUser.role === 'medico' && appointment.doctor_id !== authUser.doctor_id) {
    throw new Error('No puedes cancelar una cita que no te pertenece.');
  }

  if (appointment.estado === 'cancelada') {
    throw new Error('La cita ya está cancelada.');
  }

  let canceladaPor = authUser.role;

  await appointmentsRepository.updateAppointmentStatus(appointmentId, 'cancelada', {
    cancelada_por: canceladaPor,
    notas_cancelacion: reason,
  });

  return appointmentsRepository.findAppointmentById(appointmentId);
}

async function confirmAppointment(appointmentId, authUser) {
  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) throw new Error('La cita no existe.');
  if (appointment.doctor_id !== authUser.doctor_id) throw new Error('No autorizado.');
  if (appointment.estado !== 'pendiente') throw new Error('Solo se pueden confirmar citas pendientes.');

  await appointmentsRepository.updateAppointmentStatus(appointmentId, 'confirmada');
  return appointmentsRepository.findAppointmentById(appointmentId);
}

async function markAsAttended(appointmentId, authUser) {
  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) throw new Error('La cita no existe.');
  if (appointment.doctor_id !== authUser.doctor_id) throw new Error('No autorizado.');
  if (!['pendiente', 'confirmada'].includes(appointment.estado)) {
    throw new Error('La cita no puede marcarse como atendida.');
  }

  await appointmentsRepository.updateAppointmentStatus(appointmentId, 'atendida');
  return appointmentsRepository.findAppointmentById(appointmentId);
}

module.exports = {
  createAppointment,
  cancelAppointment,
  confirmAppointment,
  markAsAttended,
};
const appointmentsRepository = require('../repositories/appointments.repository');
const { isPastDateTime, isEndAfterStart, normalizeTime } = require('../utils/time');

async function createAppointment({
  patient_id,
  doctor_id,
  fecha,
  hora_inicio,
  hora_fin,
  motivo_consulta,
}) {
  const connection = await appointmentsRepository.db.getConnection();

  try {
    await connection.beginTransaction();

    const start = normalizeTime(hora_inicio);
    const end = normalizeTime(hora_fin);

    if (!motivo_consulta || !String(motivo_consulta).trim()) {
      throw new Error('El motivo de consulta es obligatorio.');
    }

    if (String(motivo_consulta).trim().length < 5) {
      throw new Error('El motivo de consulta debe tener al menos 5 caracteres.');
    }

    if (!isEndAfterStart(start, end)) {
      throw new Error('La hora de fin debe ser mayor a la hora de inicio.');
    }

    if (isPastDateTime(fecha, start)) {
      throw new Error('No se pueden agendar citas en fechas u horas pasadas.');
    }

    const doctor = await appointmentsRepository.findDoctorByIdForUpdate(
      connection,
      doctor_id
    );

    if (!doctor) {
      throw new Error('El médico no existe.');
    }

    if (Number(doctor.activo) !== 1 || Number(doctor.user_activo) !== 1) {
      throw new Error('No se permite agendar con médicos inactivos.');
    }

    const schedule = await appointmentsRepository.findDoctorScheduleForSlot(
      connection,
      doctor_id,
      fecha,
      start,
      end
    );

    if (!schedule) {
      throw new Error('El horario seleccionado está fuera de la disponibilidad del médico.');
    }

    const duplicatePatient = await appointmentsRepository.findPatientDuplicateForUpdate(
      connection,
      patient_id,
      fecha,
      start
    );

    if (duplicatePatient) {
      throw new Error('Ya tienes una cita registrada en la misma fecha y hora.');
    }

    const doctorCollision = await appointmentsRepository.findDoctorCollisionForUpdate(
      connection,
      doctor_id,
      fecha,
      start,
      end
    );

    if (doctorCollision) {
      throw new Error('El horario ya fue tomado por otra cita. Elige otro horario.');
    }

    const appointmentId = await appointmentsRepository.createAppointmentTx(
      connection,
      {
        patient_id,
        doctor_id,
        specialty_id: doctor.specialty_id,
        consultorio_id: doctor.consultorio_id,
        fecha,
        hora_inicio: start,
        hora_fin: end,
        motivo_consulta,
        estado: 'pendiente',
      }
    );

    await connection.commit();

    return appointmentsRepository.findById(appointmentId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getMyAppointments(patientId, filters) {
  return appointmentsRepository.findMyAppointments(patientId, filters);
}

async function cancelMyAppointment(appointmentId) {
  const appointment = await appointmentsRepository.findById(appointmentId);

  if (!appointment) {
    throw new Error('La cita no existe.');
  }

  if (!['pendiente', 'confirmada'].includes(appointment.estado)) {
    throw new Error('Solo se pueden cancelar citas pendientes o confirmadas.');
  }

  return appointmentsRepository.updateStatus(
    appointmentId,
    'cancelada',
    'Cancelada por el paciente'
  );
}

async function getDoctorAppointments(doctorId, filters) {
  return appointmentsRepository.findDoctorAppointments(doctorId, filters);
}

async function confirmDoctorAppointment(appointmentId) {
  const appointment = await appointmentsRepository.findById(appointmentId);

  if (!appointment) {
    throw new Error('La cita no existe.');
  }

  if (appointment.estado !== 'pendiente') {
    throw new Error('Solo se pueden confirmar citas pendientes.');
  }

  return appointmentsRepository.updateStatus(appointmentId, 'confirmada');
}

async function cancelDoctorAppointment(appointmentId) {
  const appointment = await appointmentsRepository.findById(appointmentId);

  if (!appointment) {
    throw new Error('La cita no existe.');
  }

  if (!['pendiente', 'confirmada'].includes(appointment.estado)) {
    throw new Error('Solo se pueden cancelar citas pendientes o confirmadas.');
  }

  return appointmentsRepository.updateStatus(
    appointmentId,
    'cancelada',
    'Cancelada por el médico'
  );
}

async function attendDoctorAppointment(appointmentId) {
  const appointment = await appointmentsRepository.findById(appointmentId);

  if (!appointment) {
    throw new Error('La cita no existe.');
  }

  if (appointment.estado !== 'confirmada') {
    throw new Error('Solo se pueden marcar como atendidas las citas confirmadas.');
  }

  return appointmentsRepository.updateStatus(appointmentId, 'atendida');
}

async function getAllAppointments(filters) {
  return appointmentsRepository.findAllAppointments(filters);
}

module.exports = {
  createAppointment,
  getMyAppointments,
  cancelMyAppointment,
  getDoctorAppointments,
  confirmDoctorAppointment,
  cancelDoctorAppointment,
  attendDoctorAppointment,
  getAllAppointments,
};
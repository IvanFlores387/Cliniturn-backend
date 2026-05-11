const consultationsRepository = require('../repositories/consultations.repository');
const recordsRepository = require('../repositories/records.repository');

function canReadConsultation(consultation, authUser) {
  if (authUser.role === 'admin') return true;
  if (authUser.role === 'paciente') return Number(consultation.paciente_id) === Number(authUser.id);
  if (authUser.role === 'medico') return Number(consultation.doctor_id) === Number(authUser.doctor_id);
  return false;
}

async function createConsultation(payload, authUser) {
  if (authUser.role !== 'medico') {
    throw new Error('Solo los médicos pueden registrar consultas.');
  }

  if (!authUser.doctor_id) {
    throw new Error('El usuario médico no tiene un doctor_id asociado.');
  }

  const connection = await consultationsRepository.db.getConnection();

  try {
    await connection.beginTransaction();

    const appointment = await consultationsRepository.findAppointmentForConsultation(
      connection,
      payload.appointment_id
    );

    if (!appointment) throw new Error('La cita asociada no existe.');

    if (Number(appointment.doctor_id) !== Number(authUser.doctor_id)) {
      throw new Error('No puedes registrar consulta de una cita que no te pertenece.');
    }

    if (appointment.estado === 'cancelada') {
      throw new Error('No se puede registrar consulta sobre una cita cancelada.');
    }

    if (!['confirmada', 'atendida'].includes(appointment.estado)) {
      throw new Error('Solo se puede registrar consulta cuando la cita está confirmada o atendida.');
    }

    const existing = await consultationsRepository.findByAppointmentIdTx(connection, appointment.id);
    if (existing) {
      throw new Error('Ya existe una consulta registrada para esta cita.');
    }

    const record = await recordsRepository.findOrCreateByPatientId(connection, appointment.paciente_id);

    const consultationId = await consultationsRepository.createTx(connection, {
      appointment_id: appointment.id,
      record_id: record.id,
      doctor_id: appointment.doctor_id,
      paciente_id: appointment.paciente_id,
      diagnosis: payload.diagnosis,
      treatment: payload.treatment,
      observations: payload.observations,
      vital_signs: payload.vital_signs,
      general_indications: payload.general_indications,
    });

    await consultationsRepository.markAppointmentAttendedTx(connection, appointment.id);

    await connection.commit();

    return consultationsRepository.findById(consultationId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getConsultationById(id, authUser) {
  const consultation = await consultationsRepository.findById(id);
  if (!consultation) throw new Error('Consulta no encontrada.');
  if (!canReadConsultation(consultation, authUser)) {
    throw new Error('No tienes permisos para consultar esta información clínica.');
  }
  return consultation;
}

async function getByAppointmentId(appointmentId, authUser) {
  const consultation = await consultationsRepository.findByAppointmentId(appointmentId);
  if (!consultation) throw new Error('Esta cita aún no tiene consulta registrada.');
  if (!canReadConsultation(consultation, authUser)) {
    throw new Error('No tienes permisos para consultar esta información clínica.');
  }
  return consultation;
}

async function getByPatientId(patientId, authUser) {
  if (authUser.role === 'paciente' && Number(patientId) !== Number(authUser.id)) {
    throw new Error('No puedes consultar el historial de otros pacientes.');
  }

  if (authUser.role === 'medico' && !authUser.doctor_id) {
    throw new Error('El usuario médico no tiene un doctor_id asociado.');
  }

  return consultationsRepository.findByPatientId(patientId, authUser);
}

async function updateConsultation(id, payload, authUser) {
  if (authUser.role !== 'medico') {
    throw new Error('Solo el médico responsable puede actualizar la consulta.');
  }

  const consultation = await consultationsRepository.findById(id);
  if (!consultation) throw new Error('Consulta no encontrada.');

  if (Number(consultation.doctor_id) !== Number(authUser.doctor_id)) {
    throw new Error('No puedes editar consultas de otro médico.');
  }

  const connection = await consultationsRepository.db.getConnection();
  try {
    await connection.beginTransaction();
    const updated = await consultationsRepository.updateTx(connection, id, payload);
    await connection.commit();
    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createConsultation,
  getConsultationById,
  getByAppointmentId,
  getByPatientId,
  updateConsultation,
};

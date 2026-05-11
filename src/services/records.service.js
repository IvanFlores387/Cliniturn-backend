const recordsRepository = require('../repositories/records.repository');

function ensureDoctorProfile(authUser) {
  if (authUser.role === 'medico' && !authUser.doctor_id) {
    throw new Error('El usuario médico no tiene un doctor_id asociado.');
  }
}

async function getRecords(filters, authUser) {
  ensureDoctorProfile(authUser);
  return recordsRepository.findAll(filters, authUser);
}

async function getRecordById(id, authUser) {
  ensureDoctorProfile(authUser);
  const record = await recordsRepository.findById(id, authUser);
  if (!record) throw new Error('Expediente no encontrado o sin permisos.');
  record.consultations = await recordsRepository.findConsultationsByPatientId(record.paciente_id, authUser);
  return record;
}

async function getRecordByPatientId(patientId, authUser) {
  ensureDoctorProfile(authUser);

  if (authUser.role === 'paciente' && Number(patientId) !== Number(authUser.id)) {
    throw new Error('No puedes consultar expedientes de otros pacientes.');
  }

  const record = await recordsRepository.findByPatientId(patientId, authUser);
  if (!record) throw new Error('El paciente aún no cuenta con expediente clínico.');
  record.consultations = await recordsRepository.findConsultationsByPatientId(patientId, authUser);
  return record;
}

async function getMyRecord(authUser) {
  if (authUser.role !== 'paciente') {
    throw new Error('Este endpoint solo está disponible para pacientes.');
  }
  return getRecordByPatientId(authUser.id, authUser);
}

module.exports = {
  getRecords,
  getRecordById,
  getRecordByPatientId,
  getMyRecord,
};

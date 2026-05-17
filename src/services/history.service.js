const historyRepository = require('../repositories/history.repository');

function ensureDoctorProfile(authUser) {
  if (authUser.role === 'medico' && !authUser.doctor_id) {
    throw new Error('El usuario médico no tiene un doctor_id asociado.');
  }
}

async function getPatientHistory(patientId, authUser) {
  ensureDoctorProfile(authUser);

  if (authUser.role === 'paciente' && Number(patientId) !== Number(authUser.id)) {
    const error = new Error('No puedes consultar el historial de otro paciente.');
    error.status = 403;
    throw error;
  }

  if (authUser.role === 'medico') {
    const allowed = await historyRepository.doctorHasAttendedPatient(authUser.doctor_id, patientId);
    if (!allowed) {
      const error = new Error('No tienes permisos para consultar el historial de este paciente.');
      error.status = 403;
      throw error;
    }
  }

  const history = await historyRepository.getPatientHistory(patientId, authUser);
  if (!history) {
    const error = new Error('Historial del paciente no encontrado.');
    error.status = 404;
    throw error;
  }

  return history;
}

async function getMyHistory(authUser) {
  if (authUser.role !== 'paciente') {
    const error = new Error('Este endpoint solo está disponible para pacientes.');
    error.status = 403;
    throw error;
  }

  return getPatientHistory(authUser.id, authUser);
}

async function getDoctorPatients(authUser) {
  ensureDoctorProfile(authUser);
  if (authUser.role !== 'medico') {
    const error = new Error('Este endpoint solo está disponible para médicos.');
    error.status = 403;
    throw error;
  }
  return historyRepository.getDoctorPatients(authUser.doctor_id);
}

module.exports = {
  getPatientHistory,
  getMyHistory,
  getDoctorPatients,
};

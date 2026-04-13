const dashboardRepository = require('../repositories/dashboard.repository');

async function getPatientDashboard(user) {
  return dashboardRepository.getPatientDashboard(user.id);
}

async function getDoctorDashboard(user) {
  if (!user.doctor_id) {
    throw new Error('El usuario médico no tiene un doctor_id asociado.');
  }

  return dashboardRepository.getDoctorDashboard(user.doctor_id);
}

async function getAdminDashboard() {
  return dashboardRepository.getAdminDashboard();
}

module.exports = {
  getPatientDashboard,
  getDoctorDashboard,
  getAdminDashboard,
};
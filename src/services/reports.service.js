const reportsRepository = require('../repositories/reports.repository');

function normalizeFilters(query = {}) {
  return {
    startDate: query.startDate || query.start_date || '',
    endDate: query.endDate || query.end_date || '',
  };
}

async function getSummary(query) {
  return reportsRepository.getSummary(normalizeFilters(query));
}

async function getAppointmentsBySpecialty(query) {
  return reportsRepository.getAppointmentsBySpecialty(normalizeFilters(query));
}

async function getAppointmentsByDoctor(query) {
  return reportsRepository.getAppointmentsByDoctor(normalizeFilters(query));
}

async function getAppointmentsByMonth(query) {
  return reportsRepository.getAppointmentsByMonth(normalizeFilters(query));
}

async function getCancellationRate(query) {
  return reportsRepository.getCancellationRate(normalizeFilters(query));
}

module.exports = {
  getSummary,
  getAppointmentsBySpecialty,
  getAppointmentsByDoctor,
  getAppointmentsByMonth,
  getCancellationRate,
};

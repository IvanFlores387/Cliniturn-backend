const appointmentsRepository = require('../repositories/appointments.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination.utils');

async function getAllAppointments(query = {}) {
  const filters = {
    estado: query.estado || '',
    fecha: query.fecha || '',
    medico: query.medico || '',
    especialidad: query.especialidad || '',
  };

  const pagination = parsePagination(query);

  const { rows, total } = await appointmentsRepository.findAllAppointmentsPaginated(
    filters,
    pagination
  );

  return {
    items: rows,
    meta: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
}

module.exports = {
  getAllAppointments,
};
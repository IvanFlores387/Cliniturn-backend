const DEFAULT_DOCTOR_WEEKLY_SCHEDULE = [
  { dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '14:00:00', activo: 1 },
  { dia_semana: 1, hora_inicio: '16:00:00', hora_fin: '19:00:00', activo: 1 },

  { dia_semana: 2, hora_inicio: '09:00:00', hora_fin: '14:00:00', activo: 1 },
  { dia_semana: 2, hora_inicio: '16:00:00', hora_fin: '19:00:00', activo: 1 },

  { dia_semana: 3, hora_inicio: '09:00:00', hora_fin: '14:00:00', activo: 1 },
  { dia_semana: 3, hora_inicio: '16:00:00', hora_fin: '19:00:00', activo: 1 },

  { dia_semana: 4, hora_inicio: '09:00:00', hora_fin: '14:00:00', activo: 1 },
  { dia_semana: 4, hora_inicio: '16:00:00', hora_fin: '19:00:00', activo: 1 },

  { dia_semana: 5, hora_inicio: '09:00:00', hora_fin: '14:00:00', activo: 1 },
  { dia_semana: 5, hora_inicio: '16:00:00', hora_fin: '19:00:00', activo: 1 },

  { dia_semana: 6, hora_inicio: '09:00:00', hora_fin: '13:00:00', activo: 1 },
];

function getDefaultDoctorSchedules() {
  return DEFAULT_DOCTOR_WEEKLY_SCHEDULE.map((item) => ({ ...item }));
}

module.exports = {
  DEFAULT_DOCTOR_WEEKLY_SCHEDULE,
  getDefaultDoctorSchedules,
};
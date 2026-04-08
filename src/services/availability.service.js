const doctorsRepository = require('../repositories/doctors.repository');
const schedulesRepository = require('../repositories/schedules.repository');
const appointmentsRepository = require('../repositories/appointments.repository');
const { getDayOfWeek, addMinutesToTime, timeToMinutes } = require('../utils/date.utils');

async function getDoctorAvailability(doctorId, date) {
  const doctor = await doctorsRepository.findDoctorById(doctorId);

  if (!doctor || !doctor.activo || !doctor.user_activo) {
    throw new Error('El médico no está disponible.');
  }

  const dayOfWeek = getDayOfWeek(date);
  const schedules = await schedulesRepository.findSchedulesByDoctorAndDay(doctorId, dayOfWeek);

  if (!schedules.length) {
    return [];
  }

  const appointments = await appointmentsRepository.findDoctorAppointmentsByDate(doctorId, date);
  const busySlots = new Set(
    appointments.map(app => `${app.hora_inicio}-${app.hora_fin}`)
  );

  const slots = [];

  for (const schedule of schedules) {
    let current = schedule.hora_inicio;
    const interval = schedule.intervalo_minutos || doctor.duracion_cita_minutos;

    while (timeToMinutes(current) + interval <= timeToMinutes(schedule.hora_fin)) {
      const end = addMinutesToTime(current, interval);
      const key = `${current}-${end}`;

      if (!busySlots.has(key)) {
        slots.push({
          hora_inicio: current,
          hora_fin: end,
          disponible: true,
        });
      }

      current = end;
    }
  }

  return slots;
}

module.exports = {
  getDoctorAvailability,
};
const doctorsRepository = require('../repositories/doctors.repository');
const schedulesRepository = require('../repositories/schedules.repository');
const appointmentsRepository = require('../repositories/appointments.repository');
const doctorSchedulesRepository = require('../repositories/doctor-schedules.repository');
const {
  getDayOfWeek,
  addMinutesToTime,
  timeToMinutes,
  isPastDateTime,
} = require('../utils/date.utils');

function overlaps(startA, endA, startB, endB) {
  return (
    timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
  );
}

async function getDoctorAvailability(doctorId, date) {
  const doctor = await doctorsRepository.findDoctorById(doctorId);

  if (!doctor || !doctor.activo || !doctor.user_activo) {
    throw new Error('El médico no está disponible.');
  }

  // Si el médico no tiene horarios aún, se le crean por defecto
  await doctorSchedulesRepository.ensureDefaultSchedules(doctorId);

  const dayOfWeek = getDayOfWeek(date);
  const schedules = await schedulesRepository.findSchedulesByDoctorAndDay(
    doctorId,
    dayOfWeek
  );

  if (!schedules.length) {
    return [];
  }

  const appointments = await appointmentsRepository.findDoctorAppointmentsByDate(
    doctorId,
    date
  );

  const slots = [];

  for (const schedule of schedules) {
    let current = schedule.hora_inicio;
    const interval = Number(
      schedule.intervalo_minutos || doctor.duracion_cita_minutos || 30
    );

    while (timeToMinutes(current) + interval <= timeToMinutes(schedule.hora_fin)) {
      const end = addMinutesToTime(current, interval);

      const slotIsBusy = appointments.some((appointment) =>
        overlaps(current, end, appointment.hora_inicio, appointment.hora_fin)
      );

      // También se filtran horarios pasados para que no se muestren al usuario
      if (!slotIsBusy && !isPastDateTime(date, current)) {
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
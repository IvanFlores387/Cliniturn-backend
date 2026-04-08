function getDayOfWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.getDay();
}

function isPastDateTime(dateString, timeString) {
  const now = new Date();
  const target = new Date(`${dateString}T${timeString}`);
  return target < now;
}

function addMinutesToTime(time, minutes) {
  const [hours, mins, secs = '00'] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const newHours = Math.floor(total / 60);
  const newMins = total % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

module.exports = {
  getDayOfWeek,
  isPastDateTime,
  addMinutesToTime,
  timeToMinutes,
};
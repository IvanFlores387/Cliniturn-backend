function normalizeTime(value) {
  if (!value) return '';
  const str = String(value).trim();
  return str.length === 5 ? `${str}:00` : str;
}

function timeToMinutes(value) {
  const normalized = normalizeTime(value);
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

function isEndAfterStart(start, end) {
  return timeToMinutes(end) > timeToMinutes(start);
}

function dateToWeekDayNumber(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

function isPastDateTime(dateStr, timeStr) {
  const now = new Date();
  const dateTime = new Date(`${dateStr}T${normalizeTime(timeStr)}`);
  return dateTime.getTime() < now.getTime();
}

module.exports = {
  normalizeTime,
  timeToMinutes,
  isEndAfterStart,
  dateToWeekDayNumber,
  isPastDateTime,
};
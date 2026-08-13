const TZ = 'Asia/Kuching';

export function miriYmd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function miriWeekday(date = new Date()) {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
}

export function weekdayName(weekday: number) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    weekday
  ] ?? 'that day';
}

export function ymdToUtcDate(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function ymdFromValue(value: string | Date) {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

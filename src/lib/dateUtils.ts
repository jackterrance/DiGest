// Helpers para fechas y slots de tiempo

export const formatLocalDate = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const targetDate = new Date(date.getTime() - (offset * 60 * 1000));
  return targetDate.toISOString().split('T')[0];
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isWorkingDay = (date: Date, diasLaborales: number[]): boolean => {
  return diasLaborales.includes(date.getDay());
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const generateTimeSlots = (
  apertura: string,
  cierre: string,
  intervaloMinutos: number
): string[] => {
  const slots: string[] = [];
  const startMin = timeToMinutes(apertura);
  const endMin = timeToMinutes(cierre);

  for (let m = startMin; m < endMin; m += intervaloMinutos) {
    slots.push(minutesToTime(m));
  }
  return slots;
};

export const hasTimeConflict = (
  newStart: string,
  newEnd: string,
  existingCitas: { hora_inicio: string; hora_fin: string; estado: string }[]
): boolean => {
  const newStartMin = timeToMinutes(newStart);
  const newEndMin = timeToMinutes(newEnd);

  return existingCitas.some((c) => {
    // Solo bloquea si la cita está activa (no cancelada)
    if (c.estado === 'cancelada') return false;

    const cStart = timeToMinutes(c.hora_inicio);
    const cEnd = timeToMinutes(c.hora_fin);

    // Hay solapamiento si: newStart < cEnd AND newEnd > cStart
    return newStartMin < cEnd && newEndMin > cStart;
  });
};

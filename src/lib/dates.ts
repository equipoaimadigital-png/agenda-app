// Helpers de fecha/hora. Convención del proyecto: las horas de las citas se
// guardan como "hora de pared" del negocio (la que ve el cliente), y las
// fechas de calendario viajan como strings "YYYY-MM-DD" para evitar
// ambigüedades de zona horaria entre navegador y servidor.

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

export function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Fecha (string) y minutos desde medianoche "ahora" en la zona horaria dada. */
export function nowInTimeZone(timeZone: string): { dateStr: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
  return { dateStr, minutes: Number(get("hour")) % 24 * 60 + Number(get("minute")) };
}

/** Día de la semana (0=domingo) de una fecha "YYYY-MM-DD". */
export function weekdayOf(dateStr: string): number {
  const { year, month, day } = parseDateStr(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Suma días a una fecha "YYYY-MM-DD". */
export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseDateStr(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return toDateStr(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "viernes 7 de agosto" a partir de "YYYY-MM-DD". */
export function formatDateLong(dateStr: string): string {
  const { year, month, day } = parseDateStr(dateStr);
  void year;
  return `${WEEKDAYS_ES[weekdayOf(dateStr)]} ${day} de ${MONTHS_ES[month - 1]}`;
}

/** "vie 7 ago" corto. */
export function formatDateShort(dateStr: string): string {
  const { month, day } = parseDateStr(dateStr);
  return `${WEEKDAYS_ES[weekdayOf(dateStr)].slice(0, 3)} ${day} ${MONTHS_ES[month - 1].slice(0, 3)}`;
}

/** Extrae la fecha "YYYY-MM-DD" y la hora "HH:MM" de pared de un Date guardado. */
export function wallClockOf(date: Date): { dateStr: string; time: string } {
  return {
    dateStr: toDateStr(date.getFullYear(), date.getMonth() + 1, date.getDate()),
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  };
}

/** Construye el Date de pared para guardar una cita. */
export function wallClockDate(dateStr: string, time: string): Date {
  const { year, month, day } = parseDateStr(dateStr);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Horas que faltan para una cita, interpretando su `startTime` como "hora de
 * pared" del negocio (así se guarda) y comparando contra el "ahora" real en
 * la zona horaria del negocio.
 *
 * No depende de en qué zona corra el servidor (Vercel = UTC) ni del cambio
 * de horario de verano — que es justo lo que descuadraba la ventana del
 * cron de recordatorios, que comparaba una hora de pared "fake-UTC" contra
 * instantes reales. Puede quedar hasta ~1 h corrido si hay un cambio de
 * horario entre "ahora" y la cita; irrelevante para un recordatorio.
 */
export function hoursUntilInTimeZone(startTime: Date, timeZone: string): number {
  const wall = wallClockOf(startTime);
  const [h, m] = wall.time.split(":").map(Number);
  const b = parseDateStr(wall.dateStr);
  const bookingMinutes = Date.UTC(b.year, b.month - 1, b.day, h, m) / 60000;

  const now = nowInTimeZone(timeZone);
  const n = parseDateStr(now.dateStr);
  const nowMinutes = Date.UTC(n.year, n.month - 1, n.day) / 60000 + now.minutes;

  return (bookingMinutes - nowMinutes) / 60;
}

/** Link "agregar a Google Calendar" para una cita. */
export function buildGoogleCalendarUrl(opts: {
  title: string;
  dateStr: string;
  startTime: string;
  durationMin: number;
  details?: string;
  location?: string;
}): string {
  const { year, month, day } = parseDateStr(opts.dateStr);
  const startMin = timeToMinutes(opts.startTime);
  const endMin = startMin + opts.durationMin;
  const fmt = (min: number) =>
    `${year}${pad2(month)}${pad2(day)}T${pad2(Math.floor(min / 60))}${pad2(min % 60)}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(startMin)}/${fmt(endMin)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

import { format, getISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';

/** 'yyyy-MM-dd' en hora local (sin desfase de zona horaria). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parsea 'yyyy-MM-dd' como fecha local (evita el parseo UTC de new Date(str)). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Lunes de la semana que contiene la fecha dada (semanas de Lunes a Domingo). */
export function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (date.getDay() + 6) % 7; // 0 = Lunes
  date.setDate(date.getDate() - offset);
  return date;
}

/** Clave de semana = fecha del Lunes en 'yyyy-MM-dd'. */
export function getWeekKey(d: Date): string {
  return toDateKey(getMonday(d));
}

/** Las 7 fechas (Lunes..Domingo) de una semana dada por su clave. */
export function getWeekDates(weekKey: string): Date[] {
  const monday = parseLocalDate(weekKey);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

/** Desplaza una clave de semana en ±N semanas. */
export function shiftWeek(weekKey: string, deltaWeeks: number): string {
  const monday = parseLocalDate(weekKey);
  monday.setDate(monday.getDate() + deltaWeeks * 7);
  return toDateKey(monday);
}

/**
 * Franja horaria activa: aquella cuyo intervalo [inicio, siguiente franja) contiene
 * el momento dado. A la última franja del día se le asume 1 hora de duración.
 * Devuelve null si el momento cae fuera de todas las franjas (p. ej. de madrugada).
 */
export function getActiveHour(hours: string[], now: Date): string | null {
  const toMinutes = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  };
  const sorted = [...hours].sort((a, b) => toMinutes(a) - toMinutes(b));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < sorted.length; i++) {
    const start = toMinutes(sorted[i]);
    const end = i + 1 < sorted.length ? toMinutes(sorted[i + 1]) : start + 60;
    if (nowMinutes >= start && nowMinutes < end) return sorted[i];
  }
  return null;
}

/** Etiqueta legible: "Semana 29 · 13 al 19 de julio de 2026". */
export function weekLabel(weekKey: string): string {
  const dates = getWeekDates(weekKey);
  const monday = dates[0];
  const sunday = dates[6];
  const weekNumber = getISOWeek(monday);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const left = sameMonth
    ? format(monday, 'd', { locale: es })
    : format(monday, "d 'de' MMMM", { locale: es });
  const right = format(sunday, "d 'de' MMMM 'de' yyyy", { locale: es });
  return `Semana ${weekNumber} · ${left} al ${right}`;
}

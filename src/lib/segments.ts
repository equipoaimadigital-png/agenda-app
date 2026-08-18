/**
 * Segmentación automática de clientes — sin selector de rubro, sin panel de
 * configuración. Se descartó un sistema de "rubros" (Industry) por decisión
 * de producto porque agregaba complejidad de mantenimiento (4 variantes de
 * UI) por un beneficio que el usuario apenas notaba. Esto es lo opuesto:
 * un cálculo que corre solo, invisible, y se ajusta con la data real de cada
 * negocio en vez de depender de que alguien declare correctamente su rubro.
 *
 * Reglas (visitas = bookings con status CONFIRMED/COMPLETED y startTime <= hoy):
 * - 1 visita               → NUEVO
 * - 2 visitas               → DE_PASO (no alcanza el mínimo de 3 para "frecuente")
 * - 3+ visitas, al cadencia → FRECUENTE
 * - 3+ visitas, hace mucho que no vuelve → EN_RIESGO
 *
 * "Al cadencia" / "hace mucho" se miden contra un umbral propio del negocio,
 * no un número fijo — ver computeBusinessThresholds().
 */

export type ClientSegment = "NUEVO" | "DE_PASO" | "FRECUENTE" | "EN_RIESGO";

export const SEGMENT_LABEL: Record<ClientSegment, string> = {
  NUEVO: "Nuevo",
  DE_PASO: "De paso",
  FRECUENTE: "Frecuente",
  EN_RIESGO: "En riesgo de fuga",
};

/** Clases Tailwind por segmento — reutiliza los tokens del sistema de diseño. */
export const SEGMENT_BADGE_CLASSES: Record<ClientSegment, string> = {
  NUEVO: "bg-brand-soft text-brand",
  DE_PASO: "bg-border text-stone",
  FRECUENTE: "bg-success-soft text-success",
  EN_RIESGO: "bg-warning-soft text-warning",
};

const DEFAULT_FRECUENTE_DAYS = 60;
const DEFAULT_RIESGO_DAYS = 90;
/** Cuántos intervalos propios del negocio pesan como el default genérico —
 *  con 20 intervalos observados, el umbral ya es ~50% propio, ~50% default. */
const SHRINKAGE_K = 20;

export type BusinessThresholds = { frecuenteDays: number; riesgoDays: number };

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Promedio bayesiano: mezcla el valor propio del negocio con el default,
 *  ponderado por cuántos datos propios hay. Sin salto — un negocio nuevo
 *  arranca en el default y se acerca a su propia realidad visita a visita. */
function shrink(businessValue: number, n: number, defaultValue: number): number {
  return (SHRINKAGE_K * defaultValue + n * businessValue) / (SHRINKAGE_K + n);
}

/**
 * @param visitIntervalsDays Todos los intervalos (en días) entre visitas
 *   consecutivas de TODOS los clientes del negocio, agrupados. Un negocio sin
 *   clientes repetidos todavía pasa un arreglo vacío y recibe el default puro.
 */
export function computeBusinessThresholds(visitIntervalsDays: number[]): BusinessThresholds {
  const n = visitIntervalsDays.length;
  const med = median(visitIntervalsDays) ?? DEFAULT_FRECUENTE_DAYS / 1.5; // no debería usarse si n=0, pero evita división rara

  return {
    frecuenteDays: n === 0 ? DEFAULT_FRECUENTE_DAYS : shrink(med * 1.5, n, DEFAULT_FRECUENTE_DAYS),
    riesgoDays: n === 0 ? DEFAULT_RIESGO_DAYS : shrink(med * 2, n, DEFAULT_RIESGO_DAYS),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param visitDates Fechas de visita del cliente, en cualquier orden. Deben
 *   ser solo visitas reales (no canceladas, no futuras).
 */
export function computeClientSegment(
  visitDates: Date[],
  now: Date,
  thresholds: BusinessThresholds
): ClientSegment {
  const n = visitDates.length;
  if (n <= 1) return "NUEVO";
  if (n === 2) return "DE_PASO";

  const lastVisit = visitDates.reduce((max, d) => (d > max ? d : max), visitDates[0]);
  const daysSinceLastVisit = (now.getTime() - lastVisit.getTime()) / DAY_MS;

  return daysSinceLastVisit > thresholds.riesgoDays ? "EN_RIESGO" : "FRECUENTE";
}

/** Intervalos (en días) entre visitas consecutivas de un mismo cliente. */
export function intervalsBetweenVisits(visitDates: Date[]): number[] {
  if (visitDates.length < 2) return [];
  const sorted = [...visitDates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push((sorted[i].getTime() - sorted[i - 1].getTime()) / DAY_MS);
  }
  return intervals;
}

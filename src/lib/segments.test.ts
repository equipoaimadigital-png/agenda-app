import { describe, expect, it } from "vitest";
import {
  computeBusinessThresholds,
  computeClientSegment,
  intervalsBetweenVisits,
} from "./segments";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-08-18T00:00:00Z");
function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * day);
}

describe("computeClientSegment", () => {
  it("clasifica 0 o 1 visita como NUEVO", () => {
    const thresholds = { frecuenteDays: 60, riesgoDays: 90 };
    expect(computeClientSegment([], now, thresholds)).toBe("NUEVO");
    expect(computeClientSegment([daysAgo(5)], now, thresholds)).toBe("NUEVO");
  });

  it("clasifica exactamente 2 visitas como DE_PASO, sin importar la cadencia", () => {
    const thresholds = { frecuenteDays: 60, riesgoDays: 90 };
    expect(computeClientSegment([daysAgo(100), daysAgo(90)], now, thresholds)).toBe("DE_PASO");
    expect(computeClientSegment([daysAgo(5), daysAgo(2)], now, thresholds)).toBe("DE_PASO");
  });

  it("3+ visitas con la última reciente es FRECUENTE", () => {
    const thresholds = { frecuenteDays: 60, riesgoDays: 90 };
    const visits = [daysAgo(60), daysAgo(30), daysAgo(10)];
    expect(computeClientSegment(visits, now, thresholds)).toBe("FRECUENTE");
  });

  it("3+ visitas pero la última hace más del umbral de riesgo es EN_RIESGO", () => {
    const thresholds = { frecuenteDays: 60, riesgoDays: 90 };
    const visits = [daysAgo(400), daysAgo(300), daysAgo(200)];
    expect(computeClientSegment(visits, now, thresholds)).toBe("EN_RIESGO");
  });

  it("justo en el umbral de riesgo todavía es FRECUENTE (no estrictamente mayor)", () => {
    const thresholds = { frecuenteDays: 60, riesgoDays: 90 };
    const visits = [daysAgo(300), daysAgo(200), daysAgo(90)];
    expect(computeClientSegment(visits, now, thresholds)).toBe("FRECUENTE");
  });
});

describe("intervalsBetweenVisits", () => {
  it("no da intervalos con menos de 2 visitas", () => {
    expect(intervalsBetweenVisits([])).toEqual([]);
    expect(intervalsBetweenVisits([daysAgo(1)])).toEqual([]);
  });

  it("calcula los días entre visitas consecutivas, sin importar el orden de entrada", () => {
    const visits = [daysAgo(10), daysAgo(40), daysAgo(20)];
    const result = intervalsBetweenVisits(visits);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(20, 5); // de hace 40 a hace 20
    expect(result[1]).toBeCloseTo(10, 5); // de hace 20 a hace 10
  });
});

describe("computeBusinessThresholds — shrinkage bayesiano", () => {
  it("con cero intervalos observados, cae exactamente en el default genérico", () => {
    const t = computeBusinessThresholds([]);
    expect(t.frecuenteDays).toBe(60);
    expect(t.riesgoDays).toBe(90);
  });

  it("con muchos intervalos propios, se acerca a la realidad del negocio (mediana×1.5 / mediana×2)", () => {
    // Negocio con cadencia real de 10 días entre visitas, muchísimos datos (n=2000)
    const intervals = Array(2000).fill(10);
    const t = computeBusinessThresholds(intervals);
    // Con n=2000 >> k=20, el umbral debería estar muy cerca de 10*1.5=15 y 10*2=20,
    // no del default 60/90.
    expect(t.frecuenteDays).toBeGreaterThan(14);
    expect(t.frecuenteDays).toBeLessThan(16);
    expect(t.riesgoDays).toBeGreaterThan(19);
    expect(t.riesgoDays).toBeLessThan(21);
  });

  it("no hay salto brusco: el umbral se mueve gradualmente entre n=0 y n grande", () => {
    const withFewData = computeBusinessThresholds(Array(3).fill(10));
    const withNoData = computeBusinessThresholds([]);
    const withLotsOfData = computeBusinessThresholds(Array(500).fill(10));
    // Con pocos datos, el umbral ya se movió un poco desde el default puro...
    expect(withFewData.frecuenteDays).toBeLessThan(withNoData.frecuenteDays);
    // ...pero todavía está mucho más cerca del default que del valor real del negocio
    expect(withFewData.frecuenteDays).toBeGreaterThan(withLotsOfData.frecuenteDays);
  });
});

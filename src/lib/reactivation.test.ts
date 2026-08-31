import { describe, expect, it } from "vitest";
import { classifyReactivation, expectedIntervalDays, median } from "./reactivation";

const D = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);
const NOW = new Date();

describe("median", () => {
  it("impar / par / vacío", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe("expectedIntervalDays", () => {
  it("con 2+ visitas usa el promedio real del cliente", () => {
    // 3 visitas repartidas en 60 días -> 30 días de cadencia
    expect(
      expectedIntervalDays({ visitCount: 3, firstVisitAt: D(60), lastVisitAt: D(0) }, 45)
    ).toBe(30);
  });
  it("con 1 visita cae a la mediana del negocio", () => {
    expect(
      expectedIntervalDays({ visitCount: 1, firstVisitAt: D(10), lastVisitAt: D(10) }, 40)
    ).toBe(40);
  });
  it("acota la cadencia al rango [14, 120] días", () => {
    // avg real ~1 día -> piso 14
    expect(
      expectedIntervalDays({ visitCount: 10, firstVisitAt: D(9), lastVisitAt: D(0) }, 45)
    ).toBe(14);
    // avg real ~300 días -> techo 120
    expect(
      expectedIntervalDays({ visitCount: 2, firstVisitAt: D(300), lastVisitAt: D(0) }, 45)
    ).toBe(120);
  });
});

describe("classifyReactivation", () => {
  const base = {
    visitCount: 4,
    firstVisitAt: D(120),
    lastVisitAt: D(30), // cadencia ~30 días
    hasUpcoming: false,
    unsubscribed: false,
    lastCampaignAt: null,
  };

  it("dentro del ritmo -> ok", () => {
    expect(classifyReactivation({ ...base, lastVisitAt: D(20) }, NOW, 45).status).toBe("ok");
  });

  it("pasado el ritmo pero no mucho -> soon", () => {
    // 3 visitas en 60 días -> cadencia 30; última hace 35 (30 < 35 <= 39)
    expect(
      classifyReactivation(
        { ...base, firstVisitAt: D(95), lastVisitAt: D(35), visitCount: 3 },
        NOW,
        45
      ).status
    ).toBe("soon");
  });

  it("muy pasado el ritmo -> overdue", () => {
    // 3 visitas en 60 días -> cadencia 30; última hace 60 (> 30 * 1.3)
    expect(
      classifyReactivation(
        { ...base, firstVisitAt: D(120), lastVisitAt: D(60), visitCount: 3 },
        NOW,
        45
      ).status
    ).toBe("overdue");
  });

  it("nunca molesta antes de 21 días aunque la cadencia sea corta", () => {
    expect(
      classifyReactivation(
        { ...base, firstVisitAt: D(30), lastVisitAt: D(15), visitCount: 6 },
        NOW,
        45
      ).status
    ).toBe("ok");
  });

  it("con hora futura agendada -> excluded", () => {
    expect(
      classifyReactivation({ ...base, lastVisitAt: D(80), hasUpcoming: true }, NOW, 45).status
    ).toBe("excluded");
  });

  it("desuscrito -> excluded", () => {
    expect(
      classifyReactivation({ ...base, lastVisitAt: D(80), unsubscribed: true }, NOW, 45).status
    ).toBe("excluded");
  });

  it("recibió campaña hace menos de 14 días -> excluded (cooldown)", () => {
    expect(
      classifyReactivation({ ...base, lastVisitAt: D(80), lastCampaignAt: D(5) }, NOW, 45).status
    ).toBe("excluded");
    // pasado el cooldown vuelve a contar
    expect(
      classifyReactivation({ ...base, lastVisitAt: D(80), lastCampaignAt: D(20) }, NOW, 45).status
    ).toBe("overdue");
  });

  it("sin visitas previas -> excluded", () => {
    expect(
      classifyReactivation(
        { ...base, visitCount: 0, firstVisitAt: null, lastVisitAt: null },
        NOW,
        45
      ).status
    ).toBe("excluded");
  });
});

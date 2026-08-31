import { describe, expect, it } from "vitest";
import { quietestBusiestWeekday } from "./playbooks";

describe("quietestBusiestWeekday", () => {
  it("null si el negocio abre menos de 3 días", () => {
    expect(quietestBusiestWeekday([0, 5, 3, 0, 0, 0, 0])).toBeNull();
  });

  it("identifica el día abierto más flojo y el más cargado, ignorando los cerrados", () => {
    // índices: 0=dom 1=lun 2=mar 3=mié 4=jue 5=vie 6=sáb
    const counts = [0, 20, 4, 18, 15, 22, 0]; // cerrado dom y sáb
    const r = quietestBusiestWeekday(counts)!;
    expect(r.quietest).toBe(2); // martes, 4 reservas
    expect(r.busiest).toBe(5); // viernes, 22
    expect(r.openedDays).toBe(5);
  });

  it("con todos los días parejos, quietest y busiest existen igual", () => {
    const r = quietestBusiestWeekday([3, 3, 3, 3, 3, 3, 3])!;
    expect(r.openedDays).toBe(7);
    expect(typeof r.quietest).toBe("number");
    expect(typeof r.busiest).toBe("number");
  });
});

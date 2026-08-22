import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentProfessionalMock = vi.fn();
const verifyStaffOwnershipMock = vi.fn().mockResolvedValue(true);
const createManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { availability: { createMany: (...args: unknown[]) => createManyMock(...args) } },
}));
vi.mock("@/lib/auth-helpers", () => ({
  getCurrentProfessional: (...args: unknown[]) => getCurrentProfessionalMock(...args),
  verifyStaffOwnership: (...args: unknown[]) => verifyStaffOwnershipMock(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function formDataOf(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((val) => fd.append(k, val));
    else fd.set(k, v);
  }
  return fd;
}

describe("createAvailability", () => {
  beforeEach(() => {
    createManyMock.mockReset();
    getCurrentProfessionalMock.mockResolvedValue({ id: "prof-1" });
    verifyStaffOwnershipMock.mockResolvedValue(true);
  });

  // Regresión: Availability es una plantilla semanal recurrente (sin fecha),
  // no una ocurrencia puntual. Un código previo rechazaba la creación si los
  // weekdays elegidos eran "anteriores" al día de hoy en la semana actual —
  // es decir, un profesional que abría la página un miércoles no podía
  // configurar disponibilidad para lunes o martes (días completamente
  // válidos de cualquier semana futura). Se eliminó ese chequeo.
  it("permite crear disponibilidad para un weekday 'anterior' al día de hoy (es una plantilla recurrente, no una fecha puntual)", async () => {
    // Simula que "hoy" es miércoles (weekday 3)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T12:00:00")); // miércoles

    const { createAvailability } = await import("./availability");
    await createAvailability(
      formDataOf({
        staffId: "staff-1",
        weekday: ["1", "2"], // lunes y martes — "antes" del miércoles de hoy
        startTime: "09:00",
        endTime: "17:00",
      })
    );

    vi.useRealTimers();

    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        { staffId: "staff-1", weekday: 1, startMinutes: 540, endMinutes: 1020 },
        { staffId: "staff-1", weekday: 2, startMinutes: 540, endMinutes: 1020 },
      ],
    });
  });

  it("rechaza si la hora de término no es después de la de inicio", async () => {
    const { createAvailability } = await import("./availability");
    await createAvailability(
      formDataOf({ staffId: "staff-1", weekday: ["1"], startTime: "17:00", endTime: "09:00" })
    );

    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("rechaza si el staffId no pertenece al profesional logueado", async () => {
    verifyStaffOwnershipMock.mockResolvedValue(false);

    const { createAvailability } = await import("./availability");
    await createAvailability(
      formDataOf({ staffId: "staff-ajeno", weekday: ["1"], startTime: "09:00", endTime: "17:00" })
    );

    expect(createManyMock).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentProfessionalMock = vi.fn();
const verifyStaffOwnershipMock = vi.fn().mockResolvedValue(true);
const upsertMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { dateException: { upsert: (...args: unknown[]) => upsertMock(...args) } },
}));
vi.mock("@/lib/auth-helpers", () => ({
  getCurrentProfessional: (...args: unknown[]) => getCurrentProfessionalMock(...args),
  getPrimaryStaffId: vi.fn(),
  verifyStaffOwnership: (...args: unknown[]) => verifyStaffOwnershipMock(...args),
}));
vi.mock("@/lib/email", () => ({ sendCancellationEmails: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function formDataOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("addDateException", () => {
  beforeEach(() => {
    upsertMock.mockReset();
    verifyStaffOwnershipMock.mockResolvedValue(true);
    getCurrentProfessionalMock.mockResolvedValue({ id: "prof-1", timezone: "America/Santiago" });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rechaza bloquear una fecha que ya pasó", async () => {
    const { addDateException } = await import("./dashboard");
    await addDateException(formDataOf({ staffId: "staff-1", date: "2026-08-01" }));

    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("acepta bloquear una fecha de hoy o futura", async () => {
    const { addDateException } = await import("./dashboard");
    await addDateException(formDataOf({ staffId: "staff-1", date: "2026-08-25", reason: "Vacaciones" }));

    expect(upsertMock).toHaveBeenCalledWith({
      where: { staffId_date: { staffId: "staff-1", date: "2026-08-25" } },
      create: { staffId: "staff-1", date: "2026-08-25", reason: "Vacaciones" },
      update: { reason: "Vacaciones" },
    });
  });

  it("rechaza un formato de fecha inválido", async () => {
    const { addDateException } = await import("./dashboard");
    await addDateException(formDataOf({ staffId: "staff-1", date: "25-08-2026" }));

    expect(upsertMock).not.toHaveBeenCalled();
  });
});

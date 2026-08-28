import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasOverlappingBooking, PENDING_PAYMENT_TIMEOUT_MIN } from "./booking-logic";

const findFirstMock = vi.fn();
const fakeTx = { booking: { findFirst: (...args: unknown[]) => findFirstMock(...args) } } as never;

describe("hasOverlappingBooking — retención de horario con depósito pendiente", () => {
  beforeEach(() => {
    findFirstMock.mockReset().mockResolvedValue(null);
  });

  it("la consulta incluye CONFIRMED y PENDING_PAYMENT reciente en el filtro de estado", async () => {
    const start = new Date("2026-08-25T14:00:00");
    const end = new Date("2026-08-25T15:00:00");

    await hasOverlappingBooking(fakeTx, "staff-1", start, end);

    const where = findFirstMock.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { status: "CONFIRMED" },
      { status: "PENDING_PAYMENT", createdAt: { gte: expect.any(Date) } },
    ]);
  });

  // Regresión: sin este corte por tiempo, un cliente que abre el checkout de
  // depósito y nunca paga dejaría el horario retenido para siempre — nadie
  // más podría reservarlo, y el negocio no tendría forma de liberarlo sin
  // esperar a un cron (que en el plan gratuito de Vercel corre 1 vez al día).
  it("el corte de tiempo para PENDING_PAYMENT es de PENDING_PAYMENT_TIMEOUT_MIN minutos hacia atrás desde ahora", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-08-25T12:00:00Z");
    vi.setSystemTime(now);

    await hasOverlappingBooking(fakeTx, "staff-1", now, now);

    const where = findFirstMock.mock.calls[0][0].where;
    const cutoff = where.OR[1].createdAt.gte as Date;
    const expectedCutoff = new Date(now.getTime() - PENDING_PAYMENT_TIMEOUT_MIN * 60 * 1000);
    expect(cutoff.getTime()).toBe(expectedCutoff.getTime());

    vi.useRealTimers();
  });

  it("excluye el propio id cuando se pasa excludeBookingId (reprogramar no choca consigo misma)", async () => {
    await hasOverlappingBooking(fakeTx, "staff-1", new Date(), new Date(), "booking-propia");

    const where = findFirstMock.mock.calls[0][0].where;
    expect(where.id).toEqual({ not: "booking-propia" });
  });
});

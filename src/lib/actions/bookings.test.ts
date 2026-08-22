import { beforeEach, describe, expect, it, vi } from "vitest";

const bookingCountMock = vi.fn().mockResolvedValue(0);
const bookingCreateMock = vi.fn();
const loadBookingContextMock = vi.fn();
const daySlotsMock = vi.fn();
const hasOverlappingBookingMock = vi.fn().mockResolvedValue(false);
const mockTx = { booking: { create: (...args: unknown[]) => bookingCreateMock(...args) } };
const withStaffLockMock = vi.fn(async (_staffId: string, fn: (tx: unknown) => unknown) => fn(mockTx));
const resolveClientIdMock = vi.fn().mockResolvedValue("client-1");
const sendBookingEmailsMock = vi.fn().mockResolvedValue(undefined);
const sendConfirmationWhatsAppMock = vi.fn().mockResolvedValue(undefined);
const sendConfirmationSmsMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  prisma: {
    booking: {
      count: (...args: unknown[]) => bookingCountMock(...args),
      create: (...args: unknown[]) => bookingCreateMock(...args),
    },
  },
}));
vi.mock("@/lib/booking-logic", async () => {
  const actual = await vi.importActual<typeof import("@/lib/booking-logic")>("@/lib/booking-logic");
  return {
    ...actual,
    loadBookingContext: (...args: unknown[]) => loadBookingContextMock(...args),
    daySlots: (...args: unknown[]) => daySlotsMock(...args),
    hasOverlappingBooking: (...args: unknown[]) => hasOverlappingBookingMock(...args),
    withStaffLock: (...args: Parameters<typeof withStaffLockMock>) => withStaffLockMock(...args),
  };
});
vi.mock("@/lib/actions/clients", () => ({
  resolveClientId: (...args: unknown[]) => resolveClientIdMock(...args),
}));
vi.mock("@/lib/email", () => ({
  sendBookingEmails: (...args: unknown[]) => sendBookingEmailsMock(...args),
}));
vi.mock("@/lib/whatsapp", () => ({
  sendConfirmationWhatsApp: (...args: unknown[]) => sendConfirmationWhatsAppMock(...args),
  buildWhatsappLink: (phone: string, msg: string) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
}));
vi.mock("@/lib/sms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/sms")>("@/lib/sms");
  return { ...actual, sendConfirmationSms: (...args: unknown[]) => sendConfirmationSmsMock(...args) };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "1.2.3.4" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const VALID_CTX = {
  professional: { id: "prof-1", businessName: "Peluquería María", email: "maria@test.com" },
  service: { id: "service-1", name: "Corte", durationMin: 30 },
  staffOptions: [{ staff: { id: "staff-1", name: "María", color: "#fff" } }],
};

function formDataOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const BASE_FIELDS = {
  slug: "tu-agenda",
  serviceId: "service-1",
  staffId: "staff-1",
  date: "2026-08-20",
  time: "09:00",
  clientName: "Juan Pérez",
  clientPhone: "987446788",
};

describe("createPublicBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingCountMock.mockResolvedValue(0);
    hasOverlappingBookingMock.mockResolvedValue(false);
    loadBookingContextMock.mockResolvedValue(VALID_CTX);
    daySlotsMock.mockResolvedValue(["09:00", "10:00"]);
    resolveClientIdMock.mockResolvedValue("client-1");
    withStaffLockMock.mockImplementation(async (_staffId: string, fn: (tx: unknown) => unknown) => fn(mockTx));
    bookingCreateMock.mockResolvedValue({ id: "booking-1", manageToken: "token-abc" });
  });

  it("rechaza teléfono inválido (muy corto) sin llegar a tocar la base de datos", async () => {
    const { createPublicBooking } = await import("./bookings");
    const result = await createPublicBooking(formDataOf({ ...BASE_FIELDS, clientPhone: "123" }));

    expect(result.error).toMatch(/teléfono/i);
    expect(loadBookingContextMock).not.toHaveBeenCalled();
  });

  it("rechaza email con formato inválido", async () => {
    const { createPublicBooking } = await import("./bookings");
    const result = await createPublicBooking(
      formDataOf({ ...BASE_FIELDS, clientEmail: "no-es-un-email" })
    );

    expect(result.error).toMatch(/email/i);
  });

  it("rechaza si el negocio recibió 15+ reservas en los últimos 5 minutos (anti-spam)", async () => {
    bookingCountMock.mockResolvedValue(15);

    const { createPublicBooking } = await import("./bookings");
    const result = await createPublicBooking(formDataOf(BASE_FIELDS));

    expect(result.error).toMatch(/muchas solicitudes/i);
    expect(bookingCreateMock).not.toHaveBeenCalled();
  });

  it("rechaza si el horario ya no está disponible en ningún candidato", async () => {
    daySlotsMock.mockResolvedValue(["10:00"]); // "09:00" pedido no está libre

    const { createPublicBooking } = await import("./bookings");
    const result = await createPublicBooking(formDataOf(BASE_FIELDS));

    expect(result.error).toMatch(/horario ya no está disponible/i);
    expect(bookingCreateMock).not.toHaveBeenCalled();
  });

  it("si hasOverlappingBooking da true dentro del lock, no crea la reserva (protección de doble-booking)", async () => {
    hasOverlappingBookingMock.mockResolvedValue(true);

    const { createPublicBooking } = await import("./bookings");
    const result = await createPublicBooking(formDataOf(BASE_FIELDS));

    expect(bookingCreateMock).not.toHaveBeenCalled();
    expect(result.error).toBeDefined();
  });

  it("camino feliz: crea la reserva, normaliza teléfono, y dispara email+whatsapp+sms", async () => {
    const { createPublicBooking } = await import("./bookings");
    const result = await createPublicBooking(formDataOf(BASE_FIELDS));

    expect(result.success).toBe(true);
    expect(result.manageToken).toBe("token-abc");
    expect(bookingCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        professionalId: "prof-1",
        staffId: "staff-1",
        serviceId: "service-1",
        clientName: "Juan Pérez",
        clientPhone: "987446788",
      }),
    });
    expect(sendBookingEmailsMock).toHaveBeenCalledOnce();
    expect(sendConfirmationWhatsAppMock).toHaveBeenCalledOnce();
    expect(sendConfirmationSmsMock).toHaveBeenCalledOnce();
  });

  it("recorta customAnswers a máximo 20 entradas y descarta items sin forma {label, value}", async () => {
    const tooMany = Array.from({ length: 30 }, (_, i) => ({ label: `Pregunta ${i}`, value: `Respuesta ${i}` }));
    const malformed = { notLabel: "x" };

    const { createPublicBooking } = await import("./bookings");
    await createPublicBooking(
      formDataOf({
        ...BASE_FIELDS,
        customAnswers: JSON.stringify([...tooMany, malformed]),
      })
    );

    const createCall = bookingCreateMock.mock.calls[0][0];
    expect(createCall.data.customAnswers).toHaveLength(20);
    expect(createCall.data.customAnswers[0]).toEqual({ label: "Pregunta 0", value: "Respuesta 0" });
  });

  it("rechaza rate-limit tras 30 solicitudes desde la misma IP en la ventana", async () => {
    const { createPublicBooking } = await import("./bookings");

    // Agota el límite (30 permitidas)
    for (let i = 0; i < 30; i++) {
      await createPublicBooking(formDataOf(BASE_FIELDS));
    }
    const result = await createPublicBooking(formDataOf(BASE_FIELDS));

    expect(result.error).toMatch(/demasiadas solicitudes/i);
  });
});

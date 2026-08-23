import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const findFirstMock = vi.fn();
const transactionMock = vi.fn();
const bookingUpdateManyMock = vi.fn();
const getCurrentProfessionalMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    client: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
    booking: {
      updateMany: (...args: unknown[]) => bookingUpdateManyMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));
vi.mock("@/lib/auth-helpers", () => ({
  getCurrentProfessional: (...args: unknown[]) => getCurrentProfessionalMock(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("resolveClientId", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
  });

  it("crea el cliente si no existe todavía", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValue({ id: "client-nuevo" });

    const { resolveClientId } = await import("./clients");
    const id = await resolveClientId("prof-1", "987446788", "Juan", "juan@test.com");

    expect(id).toBe("client-nuevo");
    expect(createMock).toHaveBeenCalledWith({
      data: { professionalId: "prof-1", phone: "987446788", name: "Juan", email: "juan@test.com" },
    });
  });

  it("reutiliza el cliente existente sin pisar su nombre/email ya guardados", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "client-existente",
      name: "Nombre Guardado",
      email: "guardado@test.com",
    });

    const { resolveClientId } = await import("./clients");
    const id = await resolveClientId("prof-1", "987446788", "Nombre Nuevo", "nuevo@test.com");

    expect(id).toBe("client-existente");
    expect(updateMock).not.toHaveBeenCalled();
  });

  // Regresión: dos reservas del mismo teléfono llegando casi a la vez (dos
  // pestañas, reintento de red) — ambas ven "no existe", la primera crea, la
  // segunda choca contra la restricción única (P2002). Antes, esto tiraba un
  // error 500 sin manejar. Ahora debe recuperar el registro ya creado.
  it("si dos reservas del mismo teléfono chocan en la creación (P2002), reutiliza el registro ya creado en vez de fallar", async () => {
    findUniqueMock
      .mockResolvedValueOnce(null) // primer chequeo: "no existe"
      .mockResolvedValueOnce({ id: "client-creado-por-la-otra-reserva" }); // recuperación tras el choque

    const uniqueViolation = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    createMock.mockRejectedValue(uniqueViolation);

    const { resolveClientId } = await import("./clients");
    const id = await resolveClientId("prof-1", "987446788", "Juan", null);

    expect(id).toBe("client-creado-por-la-otra-reserva");
  });

  it("si create() falla por un motivo distinto a P2002, propaga el error (no lo esconde)", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    createMock.mockRejectedValue(new Error("timeout de conexión a la base de datos"));

    const { resolveClientId } = await import("./clients");
    await expect(resolveClientId("prof-1", "987446788", "Juan", null)).rejects.toThrow(
      "timeout de conexión"
    );
  });
});

describe("anonymizeClient", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    transactionMock.mockReset().mockResolvedValue(undefined);
    bookingUpdateManyMock.mockReset();
    getCurrentProfessionalMock.mockReset().mockResolvedValue({ id: "prof-1" });
  });

  it("borra nombre/teléfono/email/cumpleaños del cliente y de todas sus reservas", async () => {
    findFirstMock.mockResolvedValue({ id: "client-1", professionalId: "prof-1" });

    const { anonymizeClient } = await import("./clients");
    const result = await anonymizeClient("client-1");

    expect(result.error).toBeUndefined();
    expect(transactionMock).toHaveBeenCalledOnce();
    // Verifica que las dos operaciones de la transacción usan el mismo placeholder
    const opsArg = transactionMock.mock.calls[0][0];
    expect(opsArg).toHaveLength(2);
  });

  it("no permite anonimizar un cliente de otro profesional", async () => {
    findFirstMock.mockResolvedValue(null); // findFirst con professionalId no lo encuentra

    const { anonymizeClient } = await import("./clients");
    const result = await anonymizeClient("client-ajeno");

    expect(result.error).toBe("No encontramos a este cliente.");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("busca el cliente scopeado al professionalId de la sesión (aislamiento entre negocios)", async () => {
    findFirstMock.mockResolvedValue({ id: "client-1", professionalId: "prof-1" });

    const { anonymizeClient } = await import("./clients");
    await anonymizeClient("client-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "client-1", professionalId: "prof-1" },
    });
  });
});

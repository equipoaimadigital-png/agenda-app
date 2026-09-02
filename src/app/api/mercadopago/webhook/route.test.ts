import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.fn();
const findUniqueMock = vi.fn().mockResolvedValue({ pastDueSince: null });
const fetchPreapprovalMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    professional: {
      update: (...args: unknown[]) => updateMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));
vi.mock("@/lib/mercadopago", () => ({
  fetchPreapproval: (...args: unknown[]) => fetchPreapprovalMock(...args),
}));

const WEBHOOK_SECRET = "test-secret-123";

/** Firma un dataId igual que lo hace Mercado Pago, para probar el verificador real. */
function signRequest(dataId: string, requestId = "req-1", ts = "1700000000") {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");
  return { headers: { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId } };
}

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers });
}

describe("POST /api/mercadopago/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    updateMock.mockReset();
    fetchPreapprovalMock.mockReset();
    process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it("rechaza con 400 si falta data.id", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("https://x.test/api/mercadopago/webhook"));
    expect(res.status).toBe(400);
  });

  it("rechaza con 401 si la firma no viene o es inválida", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest("https://x.test/api/mercadopago/webhook?data.id=abc123&type=subscription_preapproval", {
        "x-signature": "ts=123,v1=firmainventada",
        "x-request-id": "req-1",
      })
    );
    expect(res.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rechaza con 401 si no hay MERCADOPAGO_WEBHOOK_SECRET configurado", async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const { POST } = await import("./route");
    const { headers } = signRequest("abc123");
    const res = await POST(
      makeRequest("https://x.test/api/mercadopago/webhook?data.id=abc123&type=subscription_preapproval", headers)
    );
    expect(res.status).toBe(401);
  });

  it("con firma válida y preapproval 'authorized', activa la suscripción del profesional correcto", async () => {
    const { headers } = signRequest("abc123");
    fetchPreapprovalMock.mockResolvedValue({
      status: "authorized",
      external_reference: "professional-xyz",
    });

    const { POST } = await import("./route");
    const res = await POST(
      makeRequest("https://x.test/api/mercadopago/webhook?data.id=abc123&type=subscription_preapproval", headers)
    );

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "professional-xyz" },
      // ACTIVE limpia cualquier período de gracia por cobro fallido.
      data: { subscriptionStatus: "ACTIVE", mpPreapprovalId: "abc123", pastDueSince: null },
    });
  });

  it("nunca confía en el body del webhook: siempre re-consulta el estado real a la API de MP", async () => {
    const { headers } = signRequest("abc123");
    fetchPreapprovalMock.mockResolvedValue({ status: "authorized", external_reference: "professional-xyz" });

    const { POST } = await import("./route");
    await POST(
      makeRequest("https://x.test/api/mercadopago/webhook?data.id=abc123&type=subscription_preapproval", headers)
    );

    expect(fetchPreapprovalMock).toHaveBeenCalledWith("abc123");
  });

  it("si la consulta a Mercado Pago falla, responde 200 igual (no reintentar indefinidamente) sin actualizar nada", async () => {
    const { headers } = signRequest("abc123");
    fetchPreapprovalMock.mockRejectedValue(new Error("timeout"));

    const { POST } = await import("./route");
    const res = await POST(
      makeRequest("https://x.test/api/mercadopago/webhook?data.id=abc123&type=subscription_preapproval", headers)
    );

    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

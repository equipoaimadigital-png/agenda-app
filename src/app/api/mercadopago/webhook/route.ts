import { createHmac, timingSafeEqual } from "crypto";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fetchPreapproval } from "@/lib/mercadopago";

/**
 * Verifica la firma que manda Mercado Pago según su algoritmo documentado:
 * HMAC-SHA256 de "id:{data.id};request-id:{x-request-id};ts:{ts};" usando
 * la clave secreta del webhook. Sin esto, cualquiera podría enviar un POST
 * falso a esta URL simulando "pago aprobado" y activar una cuenta gratis.
 */
function verifySignature(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts: Record<string, string> = {};
  for (const pair of signatureHeader.split(",")) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value) parts[key] = value;
  }
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(v1);
  if (expectedBuf.length !== givenBuf.length) return false;
  return timingSafeEqual(expectedBuf, givenBuf);
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  authorized: "ACTIVE",
  paused: "PAST_DUE",
  cancelled: "CANCELLED",
};

export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
  const type = url.searchParams.get("type") ?? "";

  if (!dataId) return new Response("falta data.id", { status: 400 });
  if (!verifySignature(req, dataId)) {
    return new Response("firma inválida", { status: 401 });
  }

  if (type === "subscription_preapproval") {
    // Nunca confiamos en el cuerpo del webhook: volvemos a consultar el
    // estado real directamente a la API de Mercado Pago con nuestro token.
    // Si esa consulta falla (ID inválido, corte de red), respondemos 200 de
    // todos modos para que MP no reintente indefinidamente un evento que
    // nunca va a poder resolverse; el error queda en el log del servidor.
    const preapproval = await fetchPreapproval(dataId).catch((err) => {
      console.error("Error consultando preapproval de Mercado Pago:", err);
      return null;
    });
    const professionalId = preapproval?.external_reference;
    const status = preapproval?.status ? STATUS_MAP[preapproval.status] : undefined;

    if (professionalId && status) {
      await prisma.professional.update({
        where: { id: professionalId },
        data: { subscriptionStatus: status, mpPreapprovalId: dataId },
      });
    }
  }

  return new Response("ok", { status: 200 });
}

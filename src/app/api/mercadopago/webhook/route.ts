import { createHmac, timingSafeEqual } from "crypto";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fetchPreapproval } from "@/lib/mercadopago";
import { fetchPayment } from "@/lib/mercadopago-connect";
import { MANUAL_PAYMENT_DAYS } from "@/lib/subscription";
import { sendBookingEmails } from "@/lib/email";
import { notifyClientPhoneConfirmation } from "@/lib/notify";

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
      try {
        await prisma.professional.update({
          where: { id: professionalId },
          data: { subscriptionStatus: status, mpPreapprovalId: dataId },
        });
      } catch (err) {
        // Fallo de DB: loguear pero responder 200 igual (no reintentar)
        console.error(
          `Webhook MP: fallo al actualizar profesional ${professionalId} con preapproval ${dataId}:`,
          err
        );
      }
    } else if (dataId) {
      // Preapproval inválido o sin profesionalId
      console.warn(
        `Webhook MP: preapproval ${dataId} sin profesionalId o status inválido. status=${preapproval?.status}`
      );
    }
  }

  if (type === "payment") {
    await handleDepositPayment(dataId);
  }

  return new Response("ok", { status: 200 });
}

const FAILED_PAYMENT_STATUSES = new Set(["rejected", "cancelled"]);

/**
 * Confirma (o libera) una reserva PENDING_PAYMENT cuando llega el aviso de
 * un pago de depósito. Se consulta con el access token de la PLATAFORMA
 * (no el del profesional) — Mercado Pago permite a la aplicación dueña del
 * client_id ver cualquier pago hecho a través de sus cuentas conectadas,
 * así se evita el problema de "no sé de qué profesional es este pago hasta
 * consultarlo".
 */
async function handleDepositPayment(paymentId: string): Promise<void> {
  const platformToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!platformToken) return;

  const payment = await fetchPayment(platformToken, paymentId).catch((err) => {
    console.error(`Webhook MP: error consultando pago ${paymentId}:`, err);
    return null;
  });

  const ref = payment?.external_reference;
  if (!ref) return;

  // Pago ÚNICO del plan del profesional (camino manual, sin cobro recurrente).
  if (ref.startsWith("sub:")) {
    await handleManualSubscriptionPayment(ref.slice(4), payment?.status);
    return;
  }

  const bookingId = ref;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { professional: true, service: true },
  });
  // Ya no está pendiente (webhook duplicado, o alguien la canceló mientras
  // tanto) — no hay nada que hacer.
  if (!booking || booking.status !== "PENDING_PAYMENT") return;

  if (payment?.status === "approved") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED", depositPaymentId: paymentId, depositPaidAt: new Date() },
    });

    // Recién ahora se avisa — antes del pago no tenía sentido decir "confirmada"
    await Promise.all([
      sendBookingEmails({
        businessName: booking.professional.businessName,
        serviceName: booking.service.name,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        startTime: booking.startTime,
        professionalEmail: booking.professional.email,
        manageToken: booking.manageToken,
      }),
      notifyClientPhoneConfirmation({
        professionalId: booking.professional.id,
        businessName: booking.professional.businessName,
        serviceName: booking.service.name,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        startTime: booking.startTime,
        manageToken: booking.manageToken,
      }),
    ]);
  } else if (payment?.status && FAILED_PAYMENT_STATUSES.has(payment.status)) {
    // Pago rechazado o cancelado — libera el horario para que otro cliente lo tome.
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelReason: "Depósito no pagado" },
    });
  }
  // Cualquier otro estado (pending, in_process) se deja como está — el
  // cron de reservas vencidas se encarga si nunca se resuelve.
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pago único de 1 mes de plan (camino manual). Cada pago aprobado extiende
 * `subscriptionPaidUntil` ~31 días desde la fecha vigente (o desde hoy si ya
 * venció). Guarda simple contra webhooks duplicados: si la fecha ya está casi
 * un mes en el futuro, se asume que este pago ya se aplicó.
 */
async function handleManualSubscriptionPayment(
  professionalId: string,
  status?: string
): Promise<void> {
  if (status !== "approved") return;

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { subscriptionPaidUntil: true },
  });
  if (!professional) return;

  const currentUntil = professional.subscriptionPaidUntil?.getTime() ?? 0;
  if (currentUntil > Date.now() + (MANUAL_PAYMENT_DAYS - 2) * DAY_MS) {
    // Ya cubierto por un pago reciente — probablemente un reintento del webhook.
    return;
  }

  const base = Math.max(Date.now(), currentUntil);
  await prisma.professional.update({
    where: { id: professionalId },
    data: { subscriptionPaidUntil: new Date(base + MANUAL_PAYMENT_DAYS * DAY_MS) },
  });
}

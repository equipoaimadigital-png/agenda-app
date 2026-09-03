import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PENDING_PAYMENT_TIMEOUT_MIN } from "@/lib/booking-logic";

/**
 * Marca como CANCELLED las reservas PENDING_PAYMENT abandonadas (cliente
 * empezó a pagar el depósito y nunca terminó). Esto es solo prolijidad de
 * datos — el horario ya se libera solo en cuanto pasa el plazo, sin
 * depender de este cron (ver activeBookingStatusFilter en booking-logic.ts),
 * porque el plan gratuito de Vercel solo permite crons 1 vez al día y ese
 * plazo es de minutos.
 */
export async function GET(request: NextRequest) {
  // Fail-closed: sin CRON_SECRET el endpoint queda cerrado.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - PENDING_PAYMENT_TIMEOUT_MIN * 60 * 1000);

  const { count } = await prisma.booking.updateMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
    data: { status: "CANCELLED", cancelReason: "Depósito no pagado a tiempo" },
  });

  return NextResponse.json({ expired: count });
}

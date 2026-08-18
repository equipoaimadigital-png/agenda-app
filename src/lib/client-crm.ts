import { prisma } from "@/lib/db";
import { computeBusinessThresholds, intervalsBetweenVisits, type BusinessThresholds } from "@/lib/segments";

/** Umbral de "frecuente"/"en riesgo" de un negocio — ver segments.ts. */
export async function getBusinessThresholds(professionalId: string): Promise<BusinessThresholds> {
  const now = new Date();
  const clients = await prisma.client.findMany({
    where: { professionalId },
    select: {
      bookings: {
        where: { status: { in: ["CONFIRMED", "COMPLETED"] }, startTime: { lte: now } },
        select: { startTime: true },
      },
    },
  });
  const allIntervals = clients.flatMap((c) => intervalsBetweenVisits(c.bookings.map((b) => b.startTime)));
  return computeBusinessThresholds(allIntervals);
}

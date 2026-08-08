// Verificación temporal del SQL crudo del bloqueo. Solo lecturas; la
// transacción se revierte a propósito. Se borra después de correr.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const prisma = new PrismaClient();
const ROLLBACK = "ROLLBACK_INTENCIONAL";

try {
  await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"prof-de-prueba"}::text))`;
    console.log("OK  pg_advisory_xact_lock(hashtext(...)) ->", JSON.stringify(locked));

    const now = new Date();
    const overlap = await tx.booking.findFirst({
      where: {
        professionalId: "prof-de-prueba",
        status: "CONFIRMED",
        startTime: { lt: now },
        endTime: { gt: now },
        id: { not: "booking-de-prueba" },
      },
      select: { id: true },
    });
    console.log("OK  consulta de solapamiento (con exclusión de id) ->", overlap);

    throw new Error(ROLLBACK);
  });
} catch (e) {
  if (e.message === ROLLBACK) {
    console.log("OK  transacción revertida: no se escribió nada.");
  } else {
    console.error("FALLO:", e.message);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}

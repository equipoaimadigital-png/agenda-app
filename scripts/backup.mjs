// Respaldo manual de la base de datos completa a un archivo JSON local.
// El plan gratuito de Supabase no incluye backups automáticos — esto llena
// ese hueco mientras no se justifique pagar el plan Pro. Uso:
//
//   npm run backup
//
// Genera backups/tuhoralista-YYYY-MM-DD-HHmm.json. Guarda ese archivo en un
// lugar seguro (no en el repositorio, no en la carpeta de Descargas) — tiene
// datos personales reales de negocios y sus clientes.

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const [
    professionals,
    staff,
    services,
    serviceFields,
    availability,
    dateExceptions,
    bookings,
    clients,
    emailCampaigns,
  ] = await Promise.all([
    prisma.professional.findMany(),
    prisma.staff.findMany(),
    prisma.service.findMany(),
    prisma.serviceField.findMany(),
    prisma.availability.findMany(),
    prisma.dateException.findMany(),
    prisma.booking.findMany(),
    prisma.client.findMany(),
    prisma.emailCampaign.findMany(),
  ]);

  const dump = {
    generatedAt: new Date().toISOString(),
    counts: {
      professionals: professionals.length,
      staff: staff.length,
      services: services.length,
      serviceFields: serviceFields.length,
      availability: availability.length,
      dateExceptions: dateExceptions.length,
      bookings: bookings.length,
      clients: clients.length,
      emailCampaigns: emailCampaigns.length,
    },
    data: {
      professionals,
      staff,
      services,
      serviceFields,
      availability,
      dateExceptions,
      bookings,
      clients,
      emailCampaigns,
    },
  };

  const dir = path.join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/:/g, "").replace(/\..+/, "").replace("T", "-");
  const file = path.join(dir, `tuhoralista-${stamp}.json`);
  await writeFile(file, JSON.stringify(dump, null, 2), "utf8");

  console.log(`Respaldo guardado en: ${file}`);
  console.log("Resumen:", dump.counts);
}

main()
  .catch((err) => {
    console.error("Falló el respaldo:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

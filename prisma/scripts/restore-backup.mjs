/**
 * Restaura un respaldo JSON (el que genera /api/cron/backup) a una base de
 * datos. ADITIVO: usa INSERT ... ON CONFLICT DO NOTHING, así que rellena lo
 * que falte y NUNCA borra ni pisa lo que ya existe.
 *
 * El destino se toma de RESTORE_DATABASE_URL (a propósito NO de DATABASE_URL,
 * para que sea imposible restaurar sobre producción sin quererlo).
 *
 *   # 1. exporta el destino (una base vacía / de prueba / o la misma prod si
 *   #    de verdad quieres rellenar filas perdidas)
 *   export RESTORE_DATABASE_URL="postgresql://...:5432/postgres"
 *
 *   # 2. dry-run — dice qué insertaría, sin escribir
 *   node prisma/scripts/restore-backup.mjs ./backups/tuhoralista-2026-09-01-1200.json
 *
 *   # 3. aplicar
 *   node prisma/scripts/restore-backup.mjs ./backups/tuhoralista-....json --apply
 *
 * NO restaura los usuarios de Supabase Auth (auth.users). Ver RESTORE-RUNBOOK.md.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const file = process.argv.find((a) => a.endsWith(".json"));
const APPLY = process.argv.includes("--apply");

if (!file) {
  console.error("Falta el archivo de respaldo. Uso: node prisma/scripts/restore-backup.mjs <backup.json> [--apply]");
  process.exit(1);
}
const target = process.env.RESTORE_DATABASE_URL;
if (!target) {
  console.error("Falta RESTORE_DATABASE_URL (el destino). No se usa DATABASE_URL a propósito.");
  process.exit(1);
}

const dump = JSON.parse(readFileSync(file, "utf8"));
const d = dump.data ?? {};
console.log(`\nRespaldo: ${file}`);
console.log(`Generado: ${dump.generatedAt ?? "?"}`);
console.log(`Destino:  ${target.replace(/:[^:@/]+@/, ":****@")}`);
console.log(`Modo:     ${APPLY ? "APLICAR" : "dry-run (no escribe)"}\n`);

const prisma = new PrismaClient({ datasources: { db: { url: target } } });

// Revive strings ISO-8601 a Date (JSON no tiene tipo fecha).
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
function revive(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "string" && ISO.test(v) ? new Date(v) : v;
  }
  return out;
}

function chunk(arr, n) {
  const r = [];
  for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n));
  return r;
}

// Orden que respeta las llaves foráneas.
const TABLES = [
  ["professionals", "professional"],
  ["staff", "staff"],
  ["services", "service"],
  ["serviceFields", "serviceField"],
  ["availability", "availability"],
  ["dateExceptions", "dateException"],
  ["clients", "client"],
  ["bookings", "booking"],
  ["emailCampaigns", "emailCampaign"],
  ["messageLogs", "messageLog"],
];

let grandInserted = 0;
for (const [key, model] of TABLES) {
  const rows = (d[key] ?? []).map(revive);
  if (rows.length === 0) {
    console.log(`  ${key.padEnd(16)} 0 en el respaldo`);
    continue;
  }
  if (!APPLY) {
    console.log(`  ${key.padEnd(16)} ${rows.length} filas insertaría (skipDuplicates)`);
    continue;
  }
  let inserted = 0;
  for (const part of chunk(rows, 500)) {
    const res = await prisma[model].createMany({ data: part, skipDuplicates: true });
    inserted += res.count;
  }
  grandInserted += inserted;
  console.log(`  ${key.padEnd(16)} ${inserted} nuevas / ${rows.length} en el respaldo`);
}

// M2M implícita Service<->Staff: tabla "_ServiceToStaff" (A = Service.id, B = Staff.id).
const pairs = d.serviceStaff ?? [];
if (pairs.length) {
  if (!APPLY) {
    console.log(`  serviceStaff      ${pairs.length} vínculos insertaría`);
  } else {
    let linked = 0;
    for (const { serviceId, staffId } of pairs) {
      const res = await prisma.$executeRawUnsafe(
        `INSERT INTO "_ServiceToStaff" ("A","B") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        serviceId,
        staffId
      );
      linked += res;
    }
    console.log(`  serviceStaff      ${linked} nuevos / ${pairs.length} en el respaldo`);
  }
}

await prisma.$disconnect();
console.log(
  APPLY
    ? `\nListo. ${grandInserted} filas nuevas insertadas. Verifica contra dump.counts.\n`
    : `\n(dry-run — corre con --apply para escribir)\n`
);

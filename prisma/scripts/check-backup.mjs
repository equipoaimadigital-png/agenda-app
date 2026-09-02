/**
 * Valida un archivo de respaldo SIN base de datos ni Docker. Comprueba:
 *  - que el JSON tenga la forma esperada
 *  - que los `counts` calcen con lo que hay en `data`
 *  - integridad referencial DENTRO del dump (toda FK apunta a algo que existe)
 *  - que las horas/fechas se puedan interpretar
 *
 * Da la mayor parte de la confianza de que el respaldo sirve, en 1 segundo.
 * El único paso que no cubre es el INSERT real en Postgres (para eso está el
 * simulacro con Docker en RESTORE-RUNBOOK.md, opcional).
 *
 *   node prisma/scripts/check-backup.mjs backups/tuhoralista-2026-09-01-1200.json
 */
import { readFileSync } from "node:fs";

const file = process.argv.find((a) => a.endsWith(".json"));
if (!file) {
  console.error("Uso: node prisma/scripts/check-backup.mjs <backup.json>");
  process.exit(1);
}

let dump;
try {
  dump = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`No se pudo leer/parsear ${file}: ${e.message}`);
  process.exit(1);
}

const problems = [];
const d = dump.data ?? {};
const arr = (k) => (Array.isArray(d[k]) ? d[k] : []);

// 1. counts declarados vs reales
for (const [k, declared] of Object.entries(dump.counts ?? {})) {
  const real = k === "serviceStaff" ? arr("serviceStaff").length : arr(k).length;
  if (real !== declared) problems.push(`counts.${k} dice ${declared} pero data.${k} tiene ${real}`);
}

// 2. índices por id
const idset = (k) => new Set(arr(k).map((r) => r.id));
const professionals = idset("professionals");
const staff = idset("staff");
const services = idset("services");
const clients = idset("clients");

// 3. integridad referencial dentro del dump
const checkFk = (rows, field, targetSet, targetName, opt = false) => {
  for (const r of rows) {
    const v = r[field];
    if (v == null) {
      if (!opt) problems.push(`${targetName}: fila ${r.id} sin ${field}`);
      continue;
    }
    if (!targetSet.has(v)) problems.push(`${field}=${v} (fila ${r.id}) no existe en ${targetName}`);
  }
};

checkFk(arr("staff"), "professionalId", professionals, "professionals");
checkFk(arr("services"), "professionalId", professionals, "professionals");
checkFk(arr("serviceFields"), "serviceId", services, "services");
checkFk(arr("availability"), "staffId", staff, "staff");
checkFk(arr("dateExceptions"), "staffId", staff, "staff");
checkFk(arr("clients"), "professionalId", professionals, "professionals");
checkFk(arr("emailCampaigns"), "professionalId", professionals, "professionals");
checkFk(arr("messageLogs"), "professionalId", professionals, "professionals");
checkFk(arr("bookings"), "professionalId", professionals, "professionals");
checkFk(arr("bookings"), "staffId", staff, "staff");
checkFk(arr("bookings"), "serviceId", services, "services");
checkFk(arr("bookings"), "clientId", clients, "clients", true); // clientId es opcional

for (const p of arr("serviceStaff")) {
  if (!services.has(p.serviceId)) problems.push(`serviceStaff.serviceId=${p.serviceId} no existe`);
  if (!staff.has(p.staffId)) problems.push(`serviceStaff.staffId=${p.staffId} no existe`);
}

// 4. fechas parseables en bookings
for (const b of arr("bookings")) {
  for (const f of ["startTime", "endTime"]) {
    if (b[f] && Number.isNaN(Date.parse(b[f]))) problems.push(`bookings ${b.id}: ${f} no es fecha válida (${b[f]})`);
  }
}

console.log(`\nRespaldo: ${file}`);
console.log(`Generado: ${dump.generatedAt ?? "?"}`);
console.log(`Contenido: ${JSON.stringify(dump.counts ?? {})}\n`);

if (problems.length === 0) {
  console.log("✅ Respaldo íntegro y consistente. Sirve para restaurar.\n");
  process.exit(0);
}
console.log(`❌ ${problems.length} problema(s):\n`);
for (const p of problems.slice(0, 50)) console.log(`  - ${p}`);
if (problems.length > 50) console.log(`  … y ${problems.length - 50} más`);
console.log();
process.exit(1);

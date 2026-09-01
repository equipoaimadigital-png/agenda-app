/**
 * Descarga respaldos del bucket privado "db-backups" de Supabase Storage a
 * ./backups/. Sin argumentos baja el más reciente; con un nombre baja ese.
 *
 *   node --env-file=.env.local prisma/scripts/fetch-backup.mjs           # el último
 *   node --env-file=.env.local prisma/scripts/fetch-backup.mjs --list    # solo listar
 *   node --env-file=.env.local prisma/scripts/fetch-backup.mjs tuhoralista-2026-09-01-1200.json
 *
 * Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (ya están en
 * .env.local).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "db-backups";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: files, error } = await supabase.storage.from(BUCKET).list("", {
  sortBy: { column: "name", order: "desc" },
});
if (error) {
  console.error("No se pudo listar el bucket:", error.message);
  process.exit(1);
}
const backups = (files ?? []).filter((f) => f.name.startsWith("tuhoralista-")).sort((a, b) => b.name.localeCompare(a.name));

if (backups.length === 0) {
  console.error("No hay respaldos en el bucket.");
  process.exit(1);
}

if (process.argv.includes("--list")) {
  console.log(`\n${backups.length} respaldos en ${BUCKET}:\n`);
  for (const f of backups) console.log(`  ${f.name}   ${((f.metadata?.size ?? 0) / 1024).toFixed(0)} KB   ${f.created_at ?? ""}`);
  console.log();
  process.exit(0);
}

const wanted = process.argv.find((a) => a.endsWith(".json")) ?? backups[0].name;
const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(wanted);
if (dlErr) {
  console.error(`No se pudo descargar ${wanted}:`, dlErr.message);
  process.exit(1);
}

mkdirSync("backups", { recursive: true });
const buf = Buffer.from(await blob.arrayBuffer());
writeFileSync(`backups/${wanted}`, buf);

let summary = "";
try {
  const parsed = JSON.parse(buf.toString("utf8"));
  summary = ` — ${JSON.stringify(parsed.counts)}`;
} catch {
  /* no pasa nada, igual quedó descargado */
}
console.log(`\nDescargado: backups/${wanted}${summary}\n`);

/**
 * Migración de datos (una vez): normaliza todos los teléfonos a E.164 y
 * fusiona las fichas de cliente que colapsan al mismo número dentro de un
 * negocio. Corre después de desplegar el fix que guarda en E.164, y antes
 * de tener clientes reales acumulando datos.
 *
 *   node --env-file=.env.local prisma/scripts/normalize-phones.mjs           # dry-run
 *   node --env-file=.env.local prisma/scripts/normalize-phones.mjs --apply   # aplica
 *
 * Debe mantener la MISMA lógica que src/lib/phone.ts:toE164.
 */
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const p = new PrismaClient();

function toE164(phone) {
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  const digits = cleaned.replace(/^56/, "");
  return `+56${digits}`;
}

let clientRenames = 0;
let clientMerges = 0;
let bookingUpdates = 0;

// 1) Clientes: normalizar y fusionar colisiones por (professionalId, E.164).
const clients = await p.client.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    id: true, professionalId: true, phone: true, name: true, email: true,
    birthday: true, lastCampaignAt: true, unsubscribed: true, createdAt: true,
  },
});

// survivor por clave "prof|e164" — el más antiguo gana
const survivor = new Map();
for (const c of clients) {
  const key = `${c.professionalId}|${toE164(c.phone)}`;
  if (!survivor.has(key)) survivor.set(key, c);
}

for (const c of clients) {
  const e164 = toE164(c.phone);
  const key = `${c.professionalId}|${e164}`;
  const keep = survivor.get(key);

  if (keep.id === c.id) {
    if (c.phone !== e164) {
      clientRenames++;
      console.log(`  rename client ${c.id}: "${c.phone}" -> "${e164}"`);
      if (APPLY) await p.client.update({ where: { id: c.id }, data: { phone: e164 } });
    }
    continue;
  }

  // c se fusiona en keep
  clientMerges++;
  console.log(`  merge client ${c.id} ("${c.phone}") -> ${keep.id} ("${e164}")`);
  if (APPLY) {
    await p.booking.updateMany({ where: { clientId: c.id }, data: { clientId: keep.id } });
    await p.client.update({
      where: { id: keep.id },
      data: {
        name: keep.name ?? c.name,
        email: keep.email ?? c.email,
        birthday: keep.birthday ?? c.birthday,
        lastCampaignAt:
          !keep.lastCampaignAt || (c.lastCampaignAt && c.lastCampaignAt > keep.lastCampaignAt)
            ? c.lastCampaignAt ?? keep.lastCampaignAt
            : keep.lastCampaignAt,
        unsubscribed: keep.unsubscribed || c.unsubscribed,
        phone: e164,
      },
    });
    await p.client.delete({ where: { id: c.id } });
  }
}

// 2) Snapshots de teléfono en Booking.
const bookings = await p.booking.findMany({ select: { id: true, clientPhone: true } });
for (const b of bookings) {
  const e164 = toE164(b.clientPhone);
  if (e164 !== b.clientPhone) {
    bookingUpdates++;
    if (APPLY) await p.booking.update({ where: { id: b.id }, data: { clientPhone: e164 } });
  }
}

console.log(
  `\n${APPLY ? "APPLIED" : "DRY-RUN"}: ${clientRenames} clientes renombrados, ` +
    `${clientMerges} fusionados, ${bookingUpdates} snapshots de reserva actualizados.`
);
if (!APPLY) console.log("Corre de nuevo con --apply para aplicar.");

await p.$disconnect();

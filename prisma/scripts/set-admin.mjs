/**
 * Deja UNA sola cuenta como administración (billingExempt = true) y quita la
 * exención a cualquier otra. Sin --apply solo muestra el estado actual.
 *
 *   node --env-file=.env.local prisma/scripts/set-admin.mjs
 *   node --env-file=.env.local prisma/scripts/set-admin.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAIL = "equipo.aimadigital@gmail.com";
const APPLY = process.argv.includes("--apply");
const p = new PrismaClient();

const all = await p.professional.findMany({
  select: { id: true, email: true, businessName: true, billingExempt: true, subscriptionStatus: true },
  orderBy: { createdAt: "asc" },
});

console.log(`\n${all.length} cuentas:\n`);
for (const pr of all) {
  const tag = pr.billingExempt ? " [EXENTA]" : "";
  console.log(`  ${pr.email.padEnd(34)} ${pr.businessName}${tag}`);
}

const shouldBeExempt = all.filter((x) => x.email.toLowerCase() === ADMIN_EMAIL && !x.billingExempt);
const shouldNotBeExempt = all.filter((x) => x.email.toLowerCase() !== ADMIN_EMAIL && x.billingExempt);

console.log(`\nCambios necesarios para que SOLO ${ADMIN_EMAIL} sea admin:`);
if (!shouldBeExempt.length && !shouldNotBeExempt.length) {
  console.log("  (ninguno — ya está correcto)");
} else {
  shouldBeExempt.forEach((x) => console.log(`  + activar exención: ${x.email}`));
  shouldNotBeExempt.forEach((x) => console.log(`  - quitar exención:  ${x.email} (${x.businessName})`));
}

if (!APPLY) {
  console.log("\n(dry-run — corre con --apply para escribir)\n");
  await p.$disconnect();
  process.exit(0);
}

if (shouldBeExempt.length) {
  await p.professional.updateMany({
    where: { email: { equals: ADMIN_EMAIL, mode: "insensitive" } },
    data: { billingExempt: true },
  });
}
if (shouldNotBeExempt.length) {
  await p.professional.updateMany({
    where: { email: { not: { equals: ADMIN_EMAIL, mode: "insensitive" } }, billingExempt: true },
    data: { billingExempt: false },
  });
}

const after = await p.professional.findMany({
  where: { billingExempt: true },
  select: { email: true, businessName: true },
});
console.log(`\nListo. Cuentas exentas ahora: ${after.map((x) => x.email).join(", ") || "(ninguna)"}\n`);

await p.$disconnect();

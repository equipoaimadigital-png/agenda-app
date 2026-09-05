/**
 * Crea (UNA sola vez) el PLAN de suscripción mensual en Mercado Pago.
 *
 * El plan es la plantilla del cobro automático: monto, moneda y frecuencia.
 * Con él, el profesional entra directo al checkout de Mercado Pago y es MP
 * quien le pide el correo y la tarjeta — la app no pide ningún dato antes.
 *
 *   node --env-file=.env.local prisma/scripts/create-mp-plan.mjs
 *
 * Copia el id que imprime a MERCADOPAGO_SUBSCRIPTION_PLAN_ID en Vercel
 * (Environment Variables) y en .env.local, y redespliega. Verifica también
 * que el init_point apunte a mercadopago.cl.
 *
 * OJO: el monto (PRICE_CLP abajo) debe coincidir con SUBSCRIPTION_PRICE_CLP
 * de src/lib/subscription.ts. Si cambias el precio, hay que volver a crear
 * el plan (Mercado Pago congela el monto del plan al crearlo).
 */

const PRICE_CLP = 14990; // = SUBSCRIPTION_PRICE_CLP en src/lib/subscription.ts

const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!token) {
  console.error(
    "Falta MERCADOPAGO_ACCESS_TOKEN. Corre:\n" +
      "  node --env-file=.env.local prisma/scripts/create-mp-plan.mjs"
  );
  process.exit(1);
}

// El plan es SIEMPRE de producción: Mercado Pago exige una back_url https
// pública (rechaza http:// y localhost). No se usa NEXT_PUBLIC_SITE_URL
// porque en .env.local apunta a localhost.
const siteUrl = "https://tuhoralista.com";

const res = await fetch("https://api.mercadopago.com/preapproval_plan", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    reason: "Tu Hora Lista — Plan mensual",
    back_url: `${siteUrl}/dashboard/suscripcion?pago=1`,
    status: "active",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: PRICE_CLP,
      currency_id: "CLP",
    },
    payment_methods_allowed: {
      payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
    },
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error("Mercado Pago rechazó la creación del plan:");
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("\n✅ Plan creado.\n");
console.log("MERCADOPAGO_SUBSCRIPTION_PLAN_ID =", data.id);
console.log("init_point (revisa que sea mercadopago.cl):", data.init_point);
console.log(
  "\nPega ese id en Vercel (Environment Variables) y en .env.local, y redespliega.\n"
);

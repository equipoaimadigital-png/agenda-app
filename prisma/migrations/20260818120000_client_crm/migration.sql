-- CRM de Clientes: agrega nombre/email editables a Client y un vínculo real
-- (clientId) entre Booking y Client. Antes, Booking.clientPhone era solo un
-- string sin relación — editar el teléfono de un cliente habría desenganchado
-- su historial en silencio. Con clientId como FK estable, eso ya no pasa.

-- 1. Nuevas columnas
ALTER TABLE "Client" ADD COLUMN "name" TEXT;
ALTER TABLE "Client" ADD COLUMN "email" TEXT;
ALTER TABLE "Booking" ADD COLUMN "clientId" TEXT;

-- 2. Crea un Client para cada (professionalId, clientPhone) que aparece en
--    Booking pero todavía no tiene ficha (ej. nunca se le guardó un cumpleaños)
INSERT INTO "Client" (id, "professionalId", phone, name, email, "unsubscribeToken", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  b."professionalId",
  b."clientPhone",
  latest."clientName",
  latest."clientEmail",
  gen_random_uuid()::text,
  now(),
  now()
FROM (
  SELECT DISTINCT "professionalId", "clientPhone" FROM "Booking"
) b
JOIN LATERAL (
  SELECT "clientName", "clientEmail"
  FROM "Booking" b2
  WHERE b2."professionalId" = b."professionalId" AND b2."clientPhone" = b."clientPhone"
  ORDER BY b2."startTime" DESC
  LIMIT 1
) latest ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "Client" c WHERE c."professionalId" = b."professionalId" AND c.phone = b."clientPhone"
);

-- 3. Rellena nombre/email en fichas que ya existían solo por el cumpleaños
UPDATE "Client" c
SET name = latest."clientName", email = COALESCE(c.email, latest."clientEmail")
FROM (
  SELECT DISTINCT ON (b."professionalId", b."clientPhone")
    b."professionalId", b."clientPhone", b."clientName", b."clientEmail"
  FROM "Booking" b
  ORDER BY b."professionalId", b."clientPhone", b."startTime" DESC
) latest
WHERE c."professionalId" = latest."professionalId"
  AND c.phone = latest."clientPhone"
  AND c.name IS NULL;

-- 4. Enlaza cada reserva existente a su ficha de cliente por teléfono
UPDATE "Booking" b
SET "clientId" = c.id
FROM "Client" c
WHERE c."professionalId" = b."professionalId" AND c.phone = b."clientPhone" AND b."clientId" IS NULL;

-- 5. Índice + llave foránea (ON DELETE SET NULL: si se borra la ficha, la
--    reserva conserva su snapshot de nombre/teléfono/email igual)
CREATE INDEX "Booking_clientId_idx" ON "Booking"("clientId");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

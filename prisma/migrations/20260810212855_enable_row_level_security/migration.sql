-- Activa Row Level Security en todas las tablas de la app.
--
-- Sin esto, Supabase expone automáticamente cada tabla del esquema "public"
-- a través de su API REST (PostgREST), accesible con la clave "anon" —
-- que es pública, va embebida en el HTML/JS de cualquier página del sitio.
-- Sin RLS, esa clave pública permitía leer y escribir TODAS las tablas
-- (profesionales, clientes, reservas) sin ningún login, sin pasar por la
-- aplicación en absoluto.
--
-- No se crea ninguna policy a propósito: sin policies, RLS deniega todo
-- acceso por defecto a los roles "anon" y "authenticated" de PostgREST.
-- La aplicación (Next.js + Prisma) sigue funcionando exactamente igual
-- porque se conecta con un usuario de Postgres con privilegios directos,
-- que no pasa por PostgREST y por lo tanto ignora RLS.

ALTER TABLE "Professional" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DateException" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_ServiceToStaff" ENABLE ROW LEVEL SECURITY;

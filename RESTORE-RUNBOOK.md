# Runbook: restaurar desde un respaldo

Qué hacer cuando se pierden datos (un `DELETE`/`UPDATE` mal filtrado, un bug,
un borrado accidental desde el panel de Supabase).

## Lo que hay

- **Respaldo automático diario**: `GET /api/cron/backup` (lo dispara GitHub
  Actions, `.github/workflows/cron.yml`) vuelca **toda la base** a un JSON y
  lo sube al bucket privado **`db-backups`** de Supabase Storage.
- **Retención**: 30 días.
- Formato del JSON:
  ```json
  {
    "generatedAt": "2026-09-01T12:00:00.000Z",
    "counts": { "professionals": 12, "bookings": 430, ... },
    "data": { "professionals": [...], "staff": [...], "bookings": [...], ... }
  }
  ```

### Qué NO incluye el respaldo

| No está | Por qué / qué hacer |
|---|---|
| **Usuarios de Supabase Auth** (`auth.users`) | El respaldo tiene `Professional.authUserId` (el id) pero no la fila de `auth.users`. Si restauras sobre **la misma base** (el caso normal), esos usuarios siguen ahí y no hay problema. Si restauras en un **proyecto Supabase nuevo**, primero exporta/importa los usuarios (Supabase Dashboard → Authentication → Users → Export, o `supabase db dump --data-only --schema auth`). |
| **Archivos de Storage** (fotos de portada, fotos de staff) | Son URLs a Supabase Storage. El bucket de imágenes se respalda aparte (o se acepta perderlas: la app muestra iniciales si no hay foto). |

---

## Escenario A — se perdieron filas, la base sigue viva  *(el más común)*

Objetivo: volver a meter lo que falta **sin tocar** lo que quedó.

1. **Descarga el respaldo más reciente ANTERIOR al incidente**
   ```bash
   node --env-file=.env.local prisma/scripts/fetch-backup.mjs --list
   node --env-file=.env.local prisma/scripts/fetch-backup.mjs tuhoralista-2026-09-01-1200.json
   ```
   Queda en `backups/` (carpeta ignorada por git — tiene datos personales).

2. **Apunta el restore a la MISMA base de producción**
   ```bash
   # el mismo valor que DATABASE_URL en Vercel (usa el pooler, puerto 5432)
   export RESTORE_DATABASE_URL="postgresql://postgres.xxxx:PASS@aws-0-...pooler.supabase.com:5432/postgres"
   ```

3. **Dry-run** (no escribe, solo dice qué haría)
   ```bash
   node prisma/scripts/restore-backup.mjs backups/tuhoralista-2026-09-01-1200.json
   ```

4. **Aplica**
   ```bash
   node prisma/scripts/restore-backup.mjs backups/tuhoralista-2026-09-01-1200.json --apply
   ```
   El script inserta con `ON CONFLICT DO NOTHING`: **rellena lo que falta y no
   pisa ni borra nada**. Reinserta también los vínculos servicio↔profesional.

5. **Verifica**
   - Compara la salida (`X nuevas / Y en el respaldo`) con `counts` del JSON.
   - Entra a la app con una cuenta afectada y revisa agenda, servicios,
     clientes.
   - Query rápida de sanidad:
     ```sql
     select count(*) from "Booking";
     select count(*) from "Professional";
     ```

> Nota: si el incidente fue un **UPDATE** que corrompió filas existentes (no
> un DELETE), el paso 4 NO las corrige (existen → `ON CONFLICT DO NOTHING` las
> salta). En ese caso ve al Escenario B: restaura a una base aparte, y desde
> ahí corrige a mano las filas malas con los valores buenos del respaldo.

---

## Escenario B — pérdida total / necesito inspeccionar sin riesgo

Objetivo: levantar una copia completa del respaldo en una base separada.

1. **Crea el destino** (una de estas):
   - Un proyecto Supabase nuevo (gratis), **o**
   - Postgres local: `docker run -e POSTGRES_PASSWORD=x -p 5433:5432 -d postgres:16`

2. **Crea el esquema** (tablas vacías) en el destino:
   ```bash
   export RESTORE_DATABASE_URL="postgresql://...destino..."
   DATABASE_URL="$RESTORE_DATABASE_URL" DIRECT_URL="$RESTORE_DATABASE_URL" \
     npx prisma migrate deploy
   ```

3. **Descarga y restaura** (igual que Escenario A, pasos 1, 3, 4) apuntando
   `RESTORE_DATABASE_URL` al destino. Como está vacío, "aditivo" == "completo".

4. **Si el destino es un proyecto Supabase nuevo y quieres que la app corra
   ahí**: importa los usuarios de `auth.users` (ver tabla de arriba), luego
   cambia `DATABASE_URL` / `DIRECT_URL` / `NEXT_PUBLIC_SUPABASE_URL` /
   `SUPABASE_SERVICE_ROLE_KEY` / claves anon en Vercel y redeploy.

---

## Verificar que un respaldo sirve

### Rápido (1 segundo, sin instalar nada) — hazlo cuando quieras

```bash
node --env-file=.env.local prisma/scripts/fetch-backup.mjs      # baja el último
node prisma/scripts/check-backup.mjs backups/tuhoralista-<último>.json
```

`check-backup.mjs` valida offline: la forma del JSON, que los `counts` calcen,
integridad referencial dentro del dump (toda FK apunta a algo que existe) y
que las fechas sean parseables. Si dice `✅`, el respaldo está sano.

### Profundo (con Docker) — opcional, hazlo una vez

Lo único que el chequeo rápido no cubre es el INSERT real en Postgres.

```bash
# 1. base de prueba local
docker run --name thl-restore-test -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:16

# 2. esquema
export RESTORE_DATABASE_URL="postgresql://postgres:test@localhost:5433/postgres"
DATABASE_URL="$RESTORE_DATABASE_URL" DIRECT_URL="$RESTORE_DATABASE_URL" npx prisma migrate deploy

# 3. traer el último respaldo real y restaurarlo
node --env-file=.env.local prisma/scripts/fetch-backup.mjs
node prisma/scripts/restore-backup.mjs backups/tuhoralista-<último>.json --apply

# 4. comprobar que los counts calzan con el JSON, luego botar la base
docker rm -f thl-restore-test
```

Si los `counts` calzan, el respaldo es bueno. Anota la fecha del último
simulacro OK en este archivo:

- Último simulacro de restore OK: _(pendiente)_

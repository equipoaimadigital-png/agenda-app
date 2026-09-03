import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "db-backups";
const RETENTION_DAYS = 30;

/**
 * Respaldo automático diario de la base completa a Supabase Storage (bucket
 * privado). El plan gratuito de Supabase no incluye backups automáticos —
 * sin esto, un error humano o un bug con un DELETE/UPDATE mal filtrado
 * pierde datos de negocios reales sin forma de recuperarlos.
 *
 * Se sube a Storage (no al filesystem de Vercel) porque las funciones
 * serverless no tienen disco persistente entre invocaciones.
 */
export async function GET(request: NextRequest) {
  // Fail-closed: sin CRON_SECRET el endpoint queda cerrado.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error("Backup: falta SUPABASE_SERVICE_ROLE_KEY, no se puede subir a Storage.");
    return NextResponse.json({ error: "Backup no configurado" }, { status: 500 });
  }

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
    messageLogs,
    servicesWithStaff,
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
    prisma.messageLog.findMany(),
    // La relación M2M Service<->Staff (qué profesional hace qué servicio) vive
    // en una tabla implícita que un findMany normal no trae. Se aplana a
    // pares { serviceId, staffId } para que el restore la reconstruya.
    prisma.service.findMany({ select: { id: true, staff: { select: { id: true } } } }),
  ]);

  const serviceStaff = servicesWithStaff.flatMap((s) =>
    s.staff.map((st) => ({ serviceId: s.id, staffId: st.id }))
  );

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
      messageLogs: messageLogs.length,
      serviceStaff: serviceStaff.length,
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
      messageLogs,
      serviceStaff,
    },
  };

  const stamp = new Date().toISOString().replace(/:/g, "").replace(/\..+/, "").replace("T", "-");
  const path = `tuhoralista-${stamp}.json`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, JSON.stringify(dump, null, 2), {
      contentType: "application/json",
      upsert: false,
    });

  if (uploadError) {
    console.error("Backup: falló la subida a Storage:", uploadError);
    return NextResponse.json({ error: "Falló el respaldo" }, { status: 500 });
  }

  // Retención: borra respaldos con más de RETENTION_DAYS para no acumular
  // espacio indefinidamente. Si falla el listado/borrado no es crítico —
  // el respaldo de hoy ya quedó guardado, se reintenta limpiar mañana.
  let deleted = 0;
  try {
    const { data: files } = await supabase.storage.from(BUCKET).list();
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const stale = (files ?? [])
      .filter((f) => f.name.startsWith("tuhoralista-") && new Date(f.created_at ?? 0).getTime() < cutoff)
      .map((f) => f.name);
    if (stale.length > 0) {
      await supabase.storage.from(BUCKET).remove(stale);
      deleted = stale.length;
    }
  } catch (err) {
    console.error("Backup: falló la limpieza de respaldos viejos (no crítico):", err);
  }

  return NextResponse.json({ ok: true, path, counts: dump.counts, deletedOldBackups: deleted });
}

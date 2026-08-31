import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { hasDashboardAccess } from "@/lib/subscription";

export async function getCurrentProfessional() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const professional = await prisma.professional.findUnique({
    where: { authUserId: user.id },
  });

  // Si el profesional confirmó un cambio de correo de acceso en Supabase,
  // sincroniza la columna Professional.email (que usan las notificaciones
  // al negocio) en el primer ingreso posterior.
  if (professional && user.email && professional.email !== user.email) {
    return prisma.professional.update({
      where: { id: professional.id },
      data: { email: user.email },
    });
  }

  return professional;
}

/**
 * Para páginas del panel que requieren una suscripción vigente (todas menos
 * /dashboard/suscripcion). La página pública de reserva nunca pasa por acá.
 */
export async function requireDashboardAccess() {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");
  if (!hasDashboardAccess(professional)) redirect("/dashboard/suscripcion");
  return professional;
}

/**
 * Staff "principal" de un negocio: el más antiguo (normalmente el único hasta
 * que se construya la UI de gestión de staff — v3 Task #14). Las pantallas de
 * Disponibilidad y Días bloqueados todavía asumen un solo profesional por
 * negocio y operan sobre este.
 */
export async function getPrimaryStaffId(professionalId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { professionalId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return staff?.id ?? null;
}

/** Confirma que este staffId pertenece a este negocio antes de operar sobre él. */
export async function verifyStaffOwnership(
  staffId: string,
  professionalId: string
): Promise<boolean> {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, professionalId },
    select: { id: true },
  });
  return !!staff;
}

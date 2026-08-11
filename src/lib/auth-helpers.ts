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

  return prisma.professional.findUnique({
    where: { authUserId: user.id },
  });
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

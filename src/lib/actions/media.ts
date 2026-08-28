"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function uploadCoverImage(formData: FormData): Promise<{ error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige una imagen primero." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Formato no soportado. Usa JPG, PNG, WEBP o GIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "La imagen es muy pesada (máximo 5 MB)." };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${professional.id}/cover.${ext}`;

  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from("business-covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("Error subiendo imagen de portada:", uploadError);
    return { error: "No se pudo subir la imagen. Intenta de nuevo." };
  }

  const { data } = supabase.storage.from("business-covers").getPublicUrl(path);
  // Cache-busting: el mismo path se sobreescribe en cada subida, así que sin
  // esto el navegador/CDN podría seguir mostrando la imagen anterior.
  const coverImageUrl = `${data.publicUrl}?v=${Date.now()}`;

  await prisma.professional.update({
    where: { id: professional.id },
    data: { coverImageUrl },
  });

  revalidatePath("/dashboard/configuracion");
  revalidatePath(`/reservar/${professional.slug}`);
  return {};
}

/**
 * Sube (o reemplaza) la foto de un profesional del negocio. Se guarda en el
 * mismo bucket público que las portadas, namespaced por negocio y por staff,
 * así que la validación de dueño del `staffId` es lo que impide que alguien
 * pise la foto de otro negocio con un request armado a mano.
 */
export async function uploadStaffPhoto(
  staffId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, professionalId: professional.id },
    select: { id: true },
  });
  if (!staff) return { error: "No encontramos a este profesional." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige una imagen primero." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Formato no soportado. Usa JPG, PNG, WEBP o GIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "La imagen es muy pesada (máximo 5 MB)." };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${professional.id}/staff/${staffId}.${ext}`;

  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from("business-covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("Error subiendo foto de profesional:", uploadError);
    return { error: "No se pudo subir la imagen. Intenta de nuevo." };
  }

  const { data } = supabase.storage.from("business-covers").getPublicUrl(path);
  const photoUrl = `${data.publicUrl}?v=${Date.now()}`;

  await prisma.staff.update({ where: { id: staffId }, data: { photoUrl } });

  revalidatePath("/dashboard/staff");
  revalidatePath(`/reservar/${professional.slug}`);
  return {};
}

/** Quita la foto de un profesional (vuelve a mostrarse el círculo con iniciales). */
export async function removeStaffPhoto(staffId: string): Promise<{ error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const result = await prisma.staff.updateMany({
    where: { id: staffId, professionalId: professional.id },
    data: { photoUrl: null },
  });
  if (result.count === 0) return { error: "No encontramos a este profesional." };

  revalidatePath("/dashboard/staff");
  revalidatePath(`/reservar/${professional.slug}`);
  return {};
}

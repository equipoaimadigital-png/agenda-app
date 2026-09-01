"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { isValidEmail } from "@/lib/validation";
import { TRIAL_DAYS } from "@/lib/subscription";

export type AuthResult = { error: string } | never;

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "negocio";
  let candidate = root;
  let n = 1;
  // Evita choques de slug entre distintos profesionales
  while (await prisma.professional.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const businessName = String(formData.get("businessName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!businessName || !email || !password) {
    return { error: "Completa todos los campos." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  console.log("[signUp] intento de registro:", email);

  // Todo lo que puede fallar (Supabase, Prisma) queda adentro de este bloque.
  // redirect() NUNCA va aquí: lanza una excepción especial de Next.js que no
  // debe ser atrapada — se hace después, según lo que dejemos en `outcome`.
  let outcome: "needsConfirmation" | "goToDashboard";
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("[signUp] Supabase devolvió error:", error.status, error.message);
      return { error: error.message };
    }
    if (!data.user) {
      console.error("[signUp] Supabase no devolvió error pero tampoco user.");
      return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
    }
    console.log("[signUp] usuario de Supabase ok:", data.user.id, "sesión:", !!data.session);

    // Si ya existe un perfil para este usuario (p. ej. un intento anterior
    // creó el usuario de Supabase pero se cortó antes de terminar), no lo
    // dupliques.
    const existing = await prisma.professional.findUnique({
      where: { authUserId: data.user.id },
    });

    if (!existing) {
      const slug = await uniqueSlug(businessName);
      const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 3600_000);
      await prisma.professional.create({
        data: {
          authUserId: data.user.id,
          email: data.user.email ?? email,
          businessName,
          slug,
          trialEndsAt,
          // Todo negocio arranca con un profesional (el dueño, "Yo"). Puede
          // agregar más desde Configuración → Profesionales.
          staff: {
            create: { name: "Yo" },
          },
        },
      });
      console.log("[signUp] Professional creado:", slug);
    } else {
      console.log("[signUp] Professional ya existía, se omite crear de nuevo:", existing.slug);
    }

    outcome = data.session ? "goToDashboard" : "needsConfirmation";
  } catch (err) {
    console.error("[signUp] excepción no manejada:", err);
    return {
      error:
        "Algo falló creando tu cuenta. Vuelve a intentar en un minuto; si persiste, escríbenos a soporte@tuhoralista.com.",
    };
  }

  if (outcome === "needsConfirmation") {
    // El proyecto de Supabase pide confirmar el email antes de iniciar sesión
    redirect("/login?confirm=1");
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Distingue credenciales inválidas vs problemas de conexión
    if (error.message.includes("invalid") || error.status === 400) {
      return { error: "Correo o contraseña incorrectos." };
    }
    // Errores de conexión, timeout, etc.
    return { error: "Problema de conexión. Intenta de nuevo en unos segundos." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Ingresa tu correo." };

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/actualizar-clave`,
  });

  // Siempre responde éxito (sin confirmar si el correo existe), por seguridad
  return { success: true };
}

export async function updatePassword(
  formData: FormData
): Promise<{ error?: string }> {
  const password = String(formData.get("password") || "");
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "No se pudo actualizar la contraseña. Pide un nuevo link e intenta de nuevo." };
  }

  redirect("/dashboard");
}

/**
 * Inicia el cambio de correo de acceso. Supabase manda un link de
 * confirmación al correo NUEVO (y, si está activado "Secure email change",
 * también al viejo). El correo solo cambia cuando se abre ese link;
 * `Professional.email` se sincroniza solo en el siguiente ingreso al panel
 * (ver getCurrentProfessional).
 */
export async function requestEmailChange(
  formData: FormData
): Promise<{ error?: string; success?: boolean; email?: string }> {
  const newEmail = String(formData.get("email") || "").trim().toLowerCase();
  if (!isValidEmail(newEmail)) return { error: "Ingresa un correo válido." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  if (user.email?.toLowerCase() === newEmail) {
    return { error: "Ese ya es tu correo actual." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard/configuracion` }
  );
  if (error) {
    return { error: "No se pudo iniciar el cambio de correo. Intenta de nuevo más tarde." };
  }

  return { success: true, email: newEmail };
}

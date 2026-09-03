"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { getConnectUrl, MP_OAUTH_STATE_COOKIE } from "@/lib/mercadopago-connect";

export async function startMercadoPagoConnect(): Promise<{ url?: string; error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  // Nonce aleatorio de un solo uso: va en la URL como `state` y también en
  // una cookie httpOnly. El callback exige que coincidan.
  const state = randomBytes(24).toString("base64url");
  const url = getConnectUrl(state);
  if (!url) return { error: "La conexión con Mercado Pago no está disponible todavía." };

  const cookieStore = await cookies();
  cookieStore.set(MP_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutos para completar el flujo
  });

  return { url };
}

export async function disconnectMercadoPago(): Promise<void> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      mpConnectedUserId: null,
      mpConnectedAccessToken: null,
      mpConnectedRefreshToken: null,
      mpConnectedAt: null,
    },
  });

  revalidatePath("/dashboard/configuracion");
}

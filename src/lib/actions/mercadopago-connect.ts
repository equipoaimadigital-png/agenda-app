"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { getConnectUrl } from "@/lib/mercadopago-connect";

export async function startMercadoPagoConnect(): Promise<{ url?: string; error?: string }> {
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/login");

  const url = getConnectUrl(professional.id);
  if (!url) return { error: "La conexión con Mercado Pago no está disponible todavía." };
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

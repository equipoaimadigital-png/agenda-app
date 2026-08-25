import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { exchangeCodeForToken } from "@/lib/mercadopago-connect";

/**
 * Vuelta del flujo OAuth de Mercado Pago Connect. Mercado Pago redirige acá
 * con un `code` de un solo uso y el `state` que mandamos al iniciar.
 */
export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/dashboard/configuracion", request.url);

  const professional = await getCurrentProfessional();
  if (!professional) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  // El profesional que vuelve del callback debe ser el mismo que inició la
  // conexión — sin esto, un código de autorización ajeno podría terminar
  // asociado a la cuenta equivocada.
  if (oauthError || !code || !state || state !== professional.id) {
    settingsUrl.searchParams.set("mp_connect_error", "1");
    return NextResponse.redirect(settingsUrl);
  }

  const result = await exchangeCodeForToken(code);
  if ("error" in result) {
    settingsUrl.searchParams.set("mp_connect_error", "1");
    return NextResponse.redirect(settingsUrl);
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      mpConnectedUserId: result.userId,
      mpConnectedAccessToken: result.accessToken,
      mpConnectedRefreshToken: result.refreshToken,
      mpConnectedAt: new Date(),
    },
  });

  settingsUrl.searchParams.set("mp_connected", "1");
  return NextResponse.redirect(settingsUrl);
}

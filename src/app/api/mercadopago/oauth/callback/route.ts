import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentProfessional } from "@/lib/auth-helpers";
import { exchangeCodeForToken, MP_OAUTH_STATE_COOKIE } from "@/lib/mercadopago-connect";
import { encryptSecret } from "@/lib/crypto";

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

  // El `state` de la vuelta debe coincidir con el nonce que guardamos en una
  // cookie httpOnly al iniciar el flujo. Es de un solo uso: se borra ya.
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(MP_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(MP_OAUTH_STATE_COOKIE);

  if (oauthError || !code || !state || !expectedState || state !== expectedState) {
    settingsUrl.searchParams.set("mp_connect_error", "1");
    return NextResponse.redirect(settingsUrl);
  }

  const result = await exchangeCodeForToken(code);
  if ("error" in result) {
    settingsUrl.searchParams.set("mp_connect_error", "1");
    return NextResponse.redirect(settingsUrl);
  }

  // Los tokens se guardan cifrados (AES-256-GCM, ver lib/crypto.ts).
  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      mpConnectedUserId: result.userId,
      mpConnectedAccessToken: encryptSecret(result.accessToken),
      mpConnectedRefreshToken: result.refreshToken
        ? encryptSecret(result.refreshToken)
        : null,
      mpConnectedAt: new Date(),
    },
  });

  settingsUrl.searchParams.set("mp_connected", "1");
  return NextResponse.redirect(settingsUrl);
}

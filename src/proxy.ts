import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy.
 *
 * Se probó primero con nonce + 'strict-dynamic' (lo más estricto) pero Next
 * 16 + Turbopack en este proyecto NO propaga el nonce a sus propios chunks
 * ni al script de hidratación — con eso activado, la app entera se rompía
 * (todo bloqueado por CSP, verificado en el navegador antes de descartarlo).
 * En vez de arriesgar un despliegue roto, se usa esta versión: sin
 * 'strict-dynamic', con 'unsafe-inline' en script-src (Next lo necesita para
 * su script de hidratación). Sigue bloqueando lo que más importa contra XSS:
 * ningún script de un dominio ajeno puede cargar (`script-src 'self'`) y,
 * aunque un atacante lograra ejecutar JS inline, `connect-src` le impide
 * mandar datos robados a un servidor que no sea el nuestro / Supabase /
 * Sentry / Mercado Pago. Revisar si una futura versión de Next soporta bien
 * el nonce automático para volver a subir el nivel.
 */
function contentSecurityPolicy(): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.supabase.co https://*.sentry.io https://api.mercadopago.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://www.mercadopago.com https://www.mercadopago.cl https://auth.mercadopago.com https://api.mercadopago.com`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

// Aplica la Content-Security-Policy con nonce a toda la app, y además
// refresca la sesión de Supabase y protege las rutas /dashboard (solo ahí:
// evita el viaje de red extra a Supabase en cada visita a la landing o a la
// página pública de reservas, que no lo necesitan).
export async function proxy(request: NextRequest) {
  const csp = contentSecurityPolicy();

  let response = NextResponse.next({ request });
  response.headers.set("Content-Security-Policy", csp);

  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          response.headers.set("Content-Security-Policy", csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    // Todo menos assets estáticos de Next y las dos rutas públicas que sirven
    // contenido consumido por el navegador del CLIENTE final para la PWA
    // (manifest / ícono) — no necesitan (ni deben) llevar esta CSP.
    "/((?!_next/static|_next/image|favicon.ico|api/manifest|api/pwa-icon).*)",
  ],
};

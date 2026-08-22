import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la Service Role Key: ignora RLS y no depende de
 * sesión de usuario ni cookies. Úsalo SOLO en código de servidor que corre
 * sin un usuario logueado (cron jobs, scripts) — nunca lo expongas a un
 * Client Component ni lo mandes al navegador.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

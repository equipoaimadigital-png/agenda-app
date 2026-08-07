import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default async function ActualizarClavePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Crea tu nueva contraseña</h1>
        </div>

        {user ? (
          <UpdatePasswordForm />
        ) : (
          <div className="bg-warning-soft border border-border rounded-xl p-4 text-sm">
            <p>
              Este link ya no es válido o expiró. Pide uno nuevo para
              continuar.
            </p>
            <Link href="/login/olvide" className="underline font-medium mt-2 inline-block">
              Pedir un nuevo link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

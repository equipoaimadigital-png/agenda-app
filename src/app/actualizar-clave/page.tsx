import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default async function ActualizarClavePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthSplitLayout tagline="Últimos pasos para volver a tu panel.">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold font-display">Crea tu nueva contraseña</h1>

        {user ? (
          <UpdatePasswordForm />
        ) : (
          <div className="bg-warning-soft border border-border rounded-xl p-4 text-sm">
            <p className="text-warning">
              Este link ya no es válido o expiró. Pide uno nuevo para
              continuar.
            </p>
            <Link href="/login/olvide" className="underline font-medium mt-2 inline-block text-brand">
              Pedir un nuevo link
            </Link>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}

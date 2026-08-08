import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { confirm } = await searchParams;

  return (
    <AuthSplitLayout tagline="Tus clientes reservan solos. Tú te concentras en atenderlos.">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold font-display">Inicia sesión</h1>
          <p className="text-sm text-stone">Entra a tu panel de agenda.</p>
        </div>

        {confirm && (
          <p className="text-sm bg-warning-soft text-warning border border-border rounded-lg px-3 py-2">
            Te enviamos un correo para confirmar tu cuenta. Revísalo antes de
            iniciar sesión.
          </p>
        )}

        <LoginForm />
        <div className="flex flex-col gap-2">
          <Link href="/login/olvide" className="text-sm text-stone underline w-fit">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-sm text-stone">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="underline text-brand">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}

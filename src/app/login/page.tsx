import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { confirm } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Inicia sesión</h1>
          <p className="text-sm text-muted">Entra a tu panel de agenda.</p>
        </div>

        {confirm && (
          <p className="text-sm bg-warning-soft text-warning border border-border rounded-lg px-3 py-2">
            Te enviamos un correo para confirmar tu cuenta. Revísalo antes de
            iniciar sesión.
          </p>
        )}

        <LoginForm />
        <p className="text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}

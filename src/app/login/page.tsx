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
          <p className="text-sm text-gray-500">Entra a tu panel de agenda.</p>
        </div>

        {confirm && (
          <p className="text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-3 py-2">
            Te enviamos un correo para confirmar tu cuenta. Revísalo antes de
            iniciar sesión.
          </p>
        )}

        <LoginForm />
        <p className="text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}

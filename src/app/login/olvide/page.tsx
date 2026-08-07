import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function OlvideClavePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Recupera tu contraseña</h1>
          <p className="text-sm text-muted mt-1">
            Te enviaremos un link a tu correo para crear una nueva.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-sm text-muted">
          <Link href="/login" className="underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </main>
  );
}

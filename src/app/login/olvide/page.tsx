import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function OlvideClavePage() {
  return (
    <AuthSplitLayout tagline="Te ayudamos a volver a entrar en un par de pasos.">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold font-display">Recupera tu contraseña</h1>
          <p className="text-sm text-stone mt-1">
            Te enviaremos un link a tu correo para crear una nueva.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-sm text-stone">
          <Link href="/login" className="underline text-brand">Volver a iniciar sesión</Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

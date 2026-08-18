import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegistroPage() {
  return (
    <AuthSplitLayout tagline="Crea tu cuenta y comparte tu link de reserva en minutos.">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold font-display">Crea tu cuenta</h1>
          <p className="text-sm text-stone">
            Empieza a recibir y agendar clientes en minutos.
          </p>
        </div>
        <RegisterForm />
        <p className="text-xs text-stone">
          Al crear tu cuenta aceptas los{" "}
          <Link href="/terminos" className="underline" target="_blank">
            Términos de Servicio
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline" target="_blank">
            Política de Privacidad
          </Link>
          .
        </p>
        <p className="text-sm text-stone">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline text-brand">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

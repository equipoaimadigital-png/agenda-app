import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Crea tu cuenta</h1>
          <p className="text-sm text-gray-500">
            Empieza a recibir y agendar clientes en minutos.
          </p>
        </div>
        <RegisterForm />
        <p className="text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

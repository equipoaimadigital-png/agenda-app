import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold max-w-md">
        Deja de agendar citas a mano
      </h1>
      <p className="max-w-md text-gray-500">
        Comparte un link, tus clientes reservan solos y tú no tienes que
        acordarte de nada.
      </p>
      <div className="flex gap-3">
        <Link
          href="/registro"
          className="bg-black text-white rounded-md px-5 py-2.5 font-medium"
        >
          Crear cuenta gratis
        </Link>
        <Link
          href="/login"
          className="border rounded-md px-5 py-2.5 font-medium"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}

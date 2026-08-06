import { getCurrentProfessional } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const professional = await getCurrentProfessional();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Próximas citas</h1>
      {professional ? (
        <p className="text-sm text-gray-500">
          Todavía no tienes citas. Comparte tu link de reserva para empezar a
          recibirlas.
        </p>
      ) : (
        <p className="text-sm text-red-600">
          No se encontró tu perfil de profesional.
        </p>
      )}
    </div>
  );
}

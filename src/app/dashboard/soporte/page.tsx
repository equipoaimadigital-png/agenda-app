import { requireDashboardAccess } from "@/lib/auth-helpers";
import { SupportForm } from "@/components/dashboard/SupportForm";

export default async function SoportePage() {
  const professional = await requireDashboardAccess();

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold font-display">Soporte</h1>
        <p className="text-sm text-stone mt-1">
          ¿Algo no funciona, o tienes una duda? Escríbenos y te contestamos directo a{" "}
          <strong>{professional.email}</strong>.
        </p>
      </div>

      <SupportForm />

      <p className="text-xs text-muted">
        Antes de escribirnos, revisa el{" "}
        <a href="/dashboard/manual" className="underline">
          Manual de uso
        </a>{" "}
        — puede que tu duda ya esté ahí.
      </p>
    </div>
  );
}

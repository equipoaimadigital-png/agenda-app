import type { Metadata } from "next";
import { unsubscribeByToken } from "@/lib/actions/campaigns";

export const metadata: Metadata = {
  title: "Desuscribirse",
  robots: { index: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function DesuscribirPage({ params }: PageProps) {
  const { token } = await params;
  const result = await unsubscribeByToken(token);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center bg-paper">
      <div className="max-w-sm">
        {result.error ? (
          <>
            <h1 className="text-xl font-semibold font-display">Link no válido</h1>
            <p className="text-stone mt-2">{result.error}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold font-display">Listo, quedaste desuscrito</h1>
            <p className="text-stone mt-2">
              No vas a recibir más campañas de email de{" "}
              <strong>{result.businessName}</strong>. Si tenías una cita reservada, no se ve
              afectada — sigue recibiendo sus confirmaciones y recordatorios normalmente.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

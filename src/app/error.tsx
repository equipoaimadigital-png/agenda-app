"use client";

export default function GlobalErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-5">
      <div className="max-w-sm w-full bg-surface border border-border rounded-2xl p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)]">
        <p className="text-3xl mb-2" aria-hidden>⚠️</p>
        <h1 className="font-display font-semibold text-xl mb-2">Algo falló de nuestro lado</h1>
        <p className="text-sm text-stone mb-5">
          No es nada que hayas hecho tú — ya nos habría gustado que fuera tan simple. Intenta de
          nuevo; si sigue pasando, escríbenos a{" "}
          <a href="mailto:soporte@tuhoralista.com" className="underline">soporte@tuhoralista.com</a>.
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

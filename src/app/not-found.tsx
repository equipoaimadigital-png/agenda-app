import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-5">
      <div className="max-w-sm w-full bg-surface border border-border rounded-2xl p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.16)]">
        <p className="text-3xl mb-2" aria-hidden>🔍</p>
        <h1 className="font-display font-semibold text-xl mb-2">No encontramos esta página</h1>
        <p className="text-sm text-stone mb-5">
          El link puede estar mal escrito o la página ya no existe.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand text-brand-foreground rounded-lg px-4 py-2.5 font-medium shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_18px_rgba(0,0,0,0.16)] active:shadow-[0_1px_0_rgba(0,0,0,0.18),0_3px_8px_rgba(0,0,0,0.12)] active:translate-y-[2px]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

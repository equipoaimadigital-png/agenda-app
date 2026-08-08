import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { Seal } from "@/components/ui/Seal";

export function EmptyAgenda({ slug, hasHistory }: { slug: string; hasHistory: boolean }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const publicUrl = `${siteUrl}/reservar/${slug}`;

  return (
    <div className="relative bg-surface border border-border rounded-xl p-8 text-center overflow-hidden">
      <div aria-hidden className="absolute inset-0 seal-texture" />
      <div className="relative flex flex-col items-center gap-3">
        <Seal size={48} />
        <p className="font-display text-xl">
          {hasHistory ? "No tienes citas próximas" : "Comparte tu link y tu primera cita puede llegar hoy"}
        </p>
        <p className="text-sm text-stone max-w-sm">
          {hasHistory
            ? "Cuando un cliente reserve, va a aparecer aquí automáticamente."
            : "Este es el link que tus clientes usan para agendar solos, sin necesitar cuenta."}
        </p>
        <div className="flex items-center gap-2 bg-paper border border-border rounded-lg px-3 py-2 mt-2 max-w-full">
          <code className="text-sm text-ink truncate">{publicUrl}</code>
        </div>
        <CopyLinkButton url={publicUrl} />
      </div>
    </div>
  );
}

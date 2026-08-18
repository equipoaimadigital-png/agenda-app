export default function ClientDetailLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl animate-pulse">
      <div className="h-8 w-56 bg-border rounded-lg" />
      <div className="h-64 bg-surface border border-border rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}

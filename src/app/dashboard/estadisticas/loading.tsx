export default function EstadisticasLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-40 bg-border rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface border border-border rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-surface border border-border rounded-xl" />
      <div className="h-24 bg-surface border border-border rounded-xl" />
      <div className="h-24 bg-surface border border-border rounded-xl" />
    </div>
  );
}

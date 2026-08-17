export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-48 bg-border rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface border border-border rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-surface border border-border rounded-xl" />
    </div>
  );
}

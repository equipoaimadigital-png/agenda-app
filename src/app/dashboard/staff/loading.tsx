export default function StaffLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl animate-pulse">
      <div className="h-8 w-40 bg-border rounded-lg" />
      <div className="h-48 bg-surface border border-border rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}

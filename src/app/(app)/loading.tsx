export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 animate-pulse rounded-md bg-line" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-line/70" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse bg-card" style={{ borderRadius: "var(--radius)" }} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-full bg-line" />
      <div className="h-4 w-80 animate-pulse rounded-full bg-line/70" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.4rem] bg-white/70" />
        ))}
      </div>
    </div>
  );
}

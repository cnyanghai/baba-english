/** 全局加载骨架屏 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="space-y-4 mb-12">
        <div className="h-3 w-48 rounded bg-muted/50" />
        <div className="h-12 w-full max-w-md rounded bg-muted/60" />
        <div className="h-12 w-3/4 max-w-sm rounded bg-muted/60" />
        <div className="h-4 w-full max-w-lg rounded bg-muted/40" />
        <div className="h-12 w-44 rounded-md bg-muted/60 mt-6" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card/30 p-5 h-28" />
        ))}
      </div>

      {/* Library skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-muted/40 border border-border/40" />
        ))}
      </div>
    </div>
  );
}

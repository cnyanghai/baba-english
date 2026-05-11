export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted/50" />
        <div className="h-4 w-32 rounded bg-muted/40" />
      </div>
      {/* video */}
      <div className="aspect-video rounded-xl bg-muted/40 border border-border/40 mb-3" />
      {/* toolbar */}
      <div className="h-12 rounded-xl bg-muted/30 border border-border/40 mb-3" />
      {/* subtitle */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-6 space-y-3">
        <div className="h-3 w-24 rounded bg-muted/50" />
        <div className="h-5 w-full rounded bg-muted/50" />
        <div className="h-4 w-3/4 rounded bg-muted/40" />
      </div>
      {/* nav */}
      <div className="flex items-stretch gap-2 pt-1 mt-3">
        <div className="h-12 w-12 rounded-md bg-muted/40" />
        <div className="h-12 flex-1 rounded-md bg-muted/40" />
      </div>
    </div>
  );
}

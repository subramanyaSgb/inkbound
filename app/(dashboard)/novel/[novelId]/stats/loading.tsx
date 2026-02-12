export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <div className="h-5 w-28 bg-ink-surface/60 rounded-md animate-pulse mb-6" />

      {/* Page title */}
      <div className="h-9 w-56 bg-ink-surface rounded-lg animate-pulse mb-8" />

      {/* 2x2 stats card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-ink-card border border-ink-border rounded-2xl p-6 space-y-4"
          >
            {/* Card label */}
            <div className="h-4 w-24 bg-ink-surface/60 rounded-md animate-pulse" />
            {/* Stat value */}
            <div className="h-8 w-20 bg-ink-surface rounded-lg animate-pulse" />
            {/* Chart / detail area */}
            <div className="h-24 w-full bg-ink-surface/30 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

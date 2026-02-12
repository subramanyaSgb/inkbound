export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page title */}
      <div className="h-9 w-36 bg-ink-surface rounded-lg animate-pulse mb-8" />

      {/* Stacked settings cards */}
      <div className="space-y-5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-ink-card border border-ink-border rounded-2xl p-6 space-y-4"
          >
            {/* Section heading */}
            <div className="h-6 w-40 bg-ink-surface rounded-md animate-pulse" />
            {/* Field rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-ink-surface/50 rounded-md animate-pulse" />
                <div className="h-9 w-48 bg-ink-surface/30 rounded-lg animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-ink-surface/50 rounded-md animate-pulse" />
                <div className="h-9 w-48 bg-ink-surface/30 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

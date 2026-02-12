export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page heading */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-9 w-52 bg-ink-surface rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-ink-surface rounded-xl animate-pulse" />
      </div>

      {/* Novel card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-ink-card border border-ink-border rounded-2xl p-5 space-y-4"
          >
            {/* Icon / cover square */}
            <div className="h-12 w-12 bg-ink-surface rounded-xl animate-pulse" />
            {/* Title line */}
            <div className="h-5 w-3/4 bg-ink-surface rounded-md animate-pulse" />
            {/* Subtitle line */}
            <div className="h-4 w-1/2 bg-ink-surface/60 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

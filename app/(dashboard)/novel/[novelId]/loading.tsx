export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <div className="h-5 w-28 bg-ink-surface/60 rounded-md animate-pulse mb-6" />

      {/* Novel title block */}
      <div className="h-10 w-72 bg-ink-surface rounded-lg animate-pulse mb-2" />
      <div className="h-5 w-48 bg-ink-surface/50 rounded-md animate-pulse mb-8" />

      {/* Action buttons row */}
      <div className="flex gap-3 mb-10">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-11 w-28 bg-ink-surface rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Chapters heading */}
      <div className="h-7 w-32 bg-ink-surface rounded-md animate-pulse mb-5" />

      {/* Chapter list items */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-ink-card border border-ink-border rounded-2xl p-4"
          >
            {/* Chapter number badge */}
            <div className="h-10 w-10 bg-ink-surface rounded-xl animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              {/* Chapter title */}
              <div className="h-5 w-3/5 bg-ink-surface rounded-md animate-pulse" />
              {/* Chapter date / subtitle */}
              <div className="h-4 w-2/5 bg-ink-surface/50 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

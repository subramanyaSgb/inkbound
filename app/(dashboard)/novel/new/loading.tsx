export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page title */}
      <div className="h-9 w-52 bg-ink-surface rounded-lg animate-pulse mb-2" />
      {/* Subtitle */}
      <div className="h-4 w-72 bg-ink-surface/40 rounded-md animate-pulse mb-10" />

      {/* Form field skeletons */}
      <div className="space-y-7">
        {/* Text input field */}
        <div className="space-y-2">
          <div className="h-4 w-20 bg-ink-surface/60 rounded-md animate-pulse" />
          <div className="h-11 w-full bg-ink-card border border-ink-border rounded-xl animate-pulse" />
        </div>

        {/* Textarea field */}
        <div className="space-y-2">
          <div className="h-4 w-28 bg-ink-surface/60 rounded-md animate-pulse" />
          <div className="h-24 w-full bg-ink-card border border-ink-border rounded-xl animate-pulse" />
        </div>

        {/* Selection grid (genre / POV) */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-ink-surface/60 rounded-md animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-11 bg-ink-card border border-ink-border rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Another selection grid */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-ink-surface/60 rounded-md animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-11 bg-ink-card border border-ink-border rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="h-12 w-full bg-ink-surface rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page title */}
      <div className="h-9 w-56 bg-ink-surface rounded-lg animate-pulse mb-2" />
      {/* Subtitle */}
      <div className="h-4 w-64 bg-ink-surface/40 rounded-md animate-pulse mb-8" />

      {/* Textarea-shaped block */}
      <div className="bg-ink-card border border-ink-border rounded-2xl p-6 mb-6">
        <div className="space-y-3">
          <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-5/6 bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-4/6 bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-3/4 bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-2/3 bg-ink-surface/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Bottom button bar */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-ink-surface/40 rounded-md animate-pulse" />
        <div className="flex gap-3">
          <div className="h-11 w-24 bg-ink-surface rounded-xl animate-pulse" />
          <div className="h-11 w-36 bg-ink-surface rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

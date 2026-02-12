export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page title */}
      <div className="h-9 w-44 bg-ink-surface rounded-lg animate-pulse mb-8" />

      {/* Large card skeleton */}
      <div className="bg-ink-card border border-ink-border rounded-2xl p-8 space-y-5">
        {/* Card heading */}
        <div className="h-7 w-48 bg-ink-surface rounded-md animate-pulse" />
        {/* Description line */}
        <div className="h-4 w-72 bg-ink-surface/50 rounded-md animate-pulse" />
        {/* Visual area */}
        <div className="h-32 w-full bg-ink-surface/20 rounded-xl animate-pulse" />
        {/* Action button */}
        <div className="h-11 w-36 bg-ink-surface rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

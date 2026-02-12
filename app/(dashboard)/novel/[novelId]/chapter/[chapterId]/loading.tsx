export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Centered chapter header */}
      <div className="flex flex-col items-center mb-10">
        <div className="h-4 w-20 bg-ink-surface/50 rounded-md animate-pulse mb-3" />
        <div className="h-9 w-64 bg-ink-surface rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-36 bg-ink-surface/40 rounded-md animate-pulse" />
      </div>

      {/* Decorative divider */}
      <div className="flex justify-center mb-10">
        <div className="h-px w-24 bg-ink-surface/60 animate-pulse" />
      </div>

      {/* Opening quote block */}
      <div className="bg-ink-card/50 border-l-2 border-ink-surface rounded-r-xl p-5 mb-10">
        <div className="h-4 w-full bg-ink-surface/40 rounded-md animate-pulse mb-2" />
        <div className="h-4 w-4/5 bg-ink-surface/40 rounded-md animate-pulse" />
      </div>

      {/* Paragraph blocks */}
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
            <div className="h-4 w-full bg-ink-surface/30 rounded-md animate-pulse" />
            <div className="h-4 w-11/12 bg-ink-surface/30 rounded-md animate-pulse" />
            <div
              className="h-4 bg-ink-surface/30 rounded-md animate-pulse"
              style={{ width: `${60 + (i % 3) * 15}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

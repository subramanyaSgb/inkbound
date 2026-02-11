import Link from 'next/link'
import type { Chapter } from '@/types'

interface BestQuotesProps {
  chapters: Chapter[]
}

export function BestQuotes({ chapters }: BestQuotesProps) {
  const quotes = chapters
    .filter(c => c.opening_quote && !c.deleted_at)
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, 10)

  if (quotes.length === 0) {
    return (
      <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Best Quotes</h3>
        <p className="text-sm text-text-muted text-center py-4">No quotes yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Best Quotes</h3>
      <div className="space-y-3">
        {quotes.map(c => (
          <Link
            key={c.id}
            href={`/novel/${c.novel_id}/chapter/${c.id}`}
            className="block p-3 rounded-lg bg-ink-surface border border-ink-border hover:border-accent-primary/30 transition-colors"
          >
            <p className="font-body italic text-sm text-text-secondary leading-relaxed">
              &ldquo;{c.opening_quote}&rdquo;
            </p>
            <p className="text-xs text-text-muted mt-2 font-ui">
              {c.title || `Chapter ${c.chapter_number}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

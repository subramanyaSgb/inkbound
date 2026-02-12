import Link from 'next/link'
import { Quote } from 'lucide-react'
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
      <div className="glass-card rounded-xl p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4 flex items-center gap-2">
          <Quote className="w-4 h-4 text-accent-primary/60" />
          Best Quotes
        </h3>
        <p className="text-sm text-text-muted text-center py-4">No quotes yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4 flex items-center gap-2">
        <Quote className="w-4 h-4 text-accent-primary/60" />
        Best Quotes
      </h3>
      <div className="space-y-3">
        {quotes.map(c => (
          <Link
            key={c.id}
            href={`/novel/${c.novel_id}/chapter/${c.id}`}
            className="block p-3 rounded-xl bg-ink-surface/30 border border-ink-border/30 hover:border-accent-primary/30 hover:bg-ink-surface/50 transition-all"
          >
            <p className="font-body italic text-sm text-text-secondary leading-relaxed">
              <span className="text-accent-primary/50 text-lg">&ldquo;</span>
              {c.opening_quote}
              <span className="text-accent-primary/50 text-lg">&rdquo;</span>
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

import Link from 'next/link'
import type { Chapter } from '@/types'

const moodEmojis: Record<string, string> = {
  joyful: '+',
  excited: '!',
  peaceful: '~',
  reflective: '.',
  anxious: '?',
  melancholic: '-',
  angry: '#',
  confused: '%',
}

export function ChapterList({ chapters, novelId }: { chapters: Chapter[]; novelId: string }) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No chapters yet.</p>
        <p className="text-text-muted text-sm mt-1">Write your first entry to generate a chapter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {chapters.map((chapter) => (
        <Link
          key={chapter.id}
          href={`/novel/${novelId}/chapter/${chapter.id}`}
          className="block"
        >
          <div className="flex items-start gap-3 p-3 md:p-4 rounded-lg border border-ink-border bg-ink-card hover:border-accent-primary/30 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center">
              <span className="text-xs md:text-sm font-ui text-text-secondary">{chapter.chapter_number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base text-text-primary truncate">
                {chapter.title || `Chapter ${chapter.chapter_number}`}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {new Date(chapter.entry_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {chapter.opening_quote && (
                <p className="text-sm text-text-secondary mt-1 italic truncate">
                  &ldquo;{chapter.opening_quote}&rdquo;
                </p>
              )}
            </div>
            {chapter.mood && (
              <span className="text-sm text-text-muted" title={chapter.mood}>
                {moodEmojis[chapter.mood] || '.'}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

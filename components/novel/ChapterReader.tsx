import type { Chapter } from '@/types'

export function ChapterReader({ chapter }: { chapter: Chapter }) {
  const paragraphs = chapter.content.split('\n').filter(p => p.trim())

  return (
    <article className="max-w-2xl mx-auto">
      <header className="text-center mb-10">
        <p className="text-sm text-text-muted font-ui mb-2">
          Chapter {chapter.chapter_number}
        </p>
        <h1 className="font-display text-3xl lg:text-4xl text-text-primary mb-6">
          {chapter.title || `Chapter ${chapter.chapter_number}`}
        </h1>
        {chapter.opening_quote && (
          <blockquote className="font-body italic text-text-secondary text-lg border-l-2 border-accent-primary/30 pl-4 mx-auto max-w-md text-left">
            {chapter.opening_quote}
          </blockquote>
        )}
      </header>

      <div className="flex justify-center mb-10">
        <div className="w-12 border-t border-ink-border" />
      </div>

      <div className="prose-reading space-y-6">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="font-body text-lg text-text-primary leading-[1.8] tracking-wide">
            {paragraph}
          </p>
        ))}
      </div>

      <footer className="mt-16 pt-8 border-t border-ink-border">
        {chapter.soundtrack_suggestion && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-ink-surface border border-ink-border mb-6">
            <span className="text-lg">~</span>
            <div>
              <p className="text-sm font-ui text-text-secondary">Soundtrack</p>
              <p className="text-sm text-text-primary">{chapter.soundtrack_suggestion}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {chapter.mood && (
            <span className="px-3 py-1 rounded-full bg-ink-surface border border-ink-border text-sm text-text-secondary">
              {chapter.mood}
            </span>
          )}
          {chapter.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-ink-surface text-sm text-text-muted">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between mt-4 text-xs text-text-muted">
          <span>
            {new Date(chapter.entry_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span>{chapter.word_count} words</span>
        </div>
      </footer>
    </article>
  )
}

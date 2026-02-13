import type { AlternateChapter } from '@/types'
import { AU_GENRES } from '@/lib/ai/alternate-prompts'

export function AlternateChapterView({ alt }: { alt: AlternateChapter }) {
  const genreInfo = AU_GENRES.find(g => g.value === alt.genre)
  const paragraphs = alt.content.split('\n').filter(p => p.trim())

  return (
    <article className="max-w-2xl mx-auto">
      <header className="text-center mb-8 md:mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-highlight text-xs font-ui text-accent-primary mb-3">
          {genreInfo?.icon} {genreInfo?.label || alt.genre}
        </span>
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-text-primary mb-6">
          {alt.title || 'Alternate Chapter'}
        </h1>
        {alt.opening_quote && (
          <blockquote className="relative font-body italic text-text-secondary text-base md:text-lg mx-auto max-w-md text-left px-6">
            <span className="absolute left-0 top-0 font-display text-3xl text-accent-primary/40 leading-none">&ldquo;</span>
            <span className="relative z-10">{alt.opening_quote}</span>
            <span className="font-display text-3xl text-accent-primary/40 leading-none">&rdquo;</span>
          </blockquote>
        )}
      </header>

      <div className="flex items-center justify-center gap-3 mb-8 md:mb-12">
        <div className="w-8 border-t border-ink-border/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/30" />
        <div className="w-8 border-t border-ink-border/50" />
      </div>

      <div className="prose-reading space-y-5 md:space-y-7">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="font-body text-base md:text-lg text-text-primary/90 leading-[1.8] md:leading-[1.9] tracking-normal md:tracking-wide first-letter:text-2xl first-letter:font-display first-letter:text-accent-primary/80 first-letter:mr-0.5">
            {paragraph}
          </p>
        ))}
      </div>

      <footer className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-ink-border/50">
        <div className="flex items-center justify-between text-xs text-text-muted">
          {alt.mood && (
            <span className="px-3 py-1 rounded-full glass-card flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              {alt.mood}
            </span>
          )}
          <span>{alt.word_count} words</span>
        </div>
      </footer>
    </article>
  )
}

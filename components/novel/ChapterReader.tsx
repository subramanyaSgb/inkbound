import { Music, Hash, Calendar, BookOpen } from 'lucide-react'
import type { Chapter } from '@/types'
import { ChapterActions } from './ChapterActions'

export function ChapterReader({ chapter, novelId }: { chapter: Chapter; novelId: string }) {
  const paragraphs = chapter.content.split('\n').filter(p => p.trim())

  return (
    <article className="max-w-2xl mx-auto">
      <header className="text-center mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-2">
          <div />
          <p className="text-xs md:text-sm text-text-muted font-ui tracking-widest uppercase">
            Chapter {chapter.chapter_number}
          </p>
          <ChapterActions
            chapterId={chapter.id}
            novelId={novelId}
            chapterTitle={chapter.title || `Chapter ${chapter.chapter_number}`}
          />
        </div>
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-text-primary mb-6">
          {chapter.title || `Chapter ${chapter.chapter_number}`}
        </h1>
        {chapter.opening_quote && (
          <blockquote className="relative font-body italic text-text-secondary text-base md:text-lg mx-auto max-w-md text-left px-6">
            <span className="absolute left-0 top-0 font-display text-3xl text-accent-primary/40 leading-none">&ldquo;</span>
            <span className="relative z-10">{chapter.opening_quote}</span>
            <span className="font-display text-3xl text-accent-primary/40 leading-none">&rdquo;</span>
          </blockquote>
        )}
      </header>

      {/* Ornamental divider */}
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
        {chapter.soundtrack_suggestion && (
          <div className="glass-card flex items-center gap-3 p-4 rounded-xl mb-4 md:mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-xs font-ui text-text-muted">Soundtrack</p>
              <p className="text-sm text-text-primary">{chapter.soundtrack_suggestion}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {chapter.mood && (
            <span className="px-3 py-1 rounded-full glass-card text-xs text-text-secondary border-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              {chapter.mood}
            </span>
          )}
          {chapter.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-ink-surface/80 text-xs text-text-muted flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between mt-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(chapter.entry_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {chapter.word_count} words
          </span>
        </div>
      </footer>
    </article>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Chapter } from '@/types'

const moodColors: Record<string, string> = {
  joyful: 'bg-yellow-500',
  excited: 'bg-orange-500',
  peaceful: 'bg-emerald-500',
  reflective: 'bg-blue-500',
  anxious: 'bg-amber-500',
  melancholic: 'bg-indigo-500',
  angry: 'bg-red-500',
  confused: 'bg-purple-500',
}

export function ChapterList({ chapters, novelId }: { chapters: Chapter[]; novelId: string }) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary font-display text-lg">No chapters yet</p>
        <p className="text-text-muted text-sm mt-1">Write your first entry to generate a chapter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {chapters.map((chapter, i) => (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
        >
          <Link
            href={`/novel/${novelId}/chapter/${chapter.id}`}
            className="block group"
          >
            <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl border border-ink-border/50 bg-ink-card/50 hover:border-accent-primary/30 hover:bg-ink-card transition-all duration-200 group-hover:translate-x-1">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
                <span className="text-xs md:text-sm font-ui text-accent-primary font-medium">{chapter.chapter_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-text-primary truncate group-hover:text-accent-primary transition-colors">
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
                <div className="flex items-center gap-1.5 flex-shrink-0" title={chapter.mood}>
                  <span className={`w-2 h-2 rounded-full ${moodColors[chapter.mood] || 'bg-text-muted'}`} />
                  <span className="text-xs text-text-muted hidden md:inline">{chapter.mood}</span>
                </div>
              )}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

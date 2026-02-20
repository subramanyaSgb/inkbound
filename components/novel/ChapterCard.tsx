'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, AlertTriangle, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

type GeneratingState = 'active' | 'slow' | 'failed'

function getGeneratingState(chapter: Chapter): GeneratingState {
  if (chapter.status === 'failed') return 'failed'

  const createdAt = new Date(chapter.created_at).getTime()
  const now = Date.now()
  const elapsedMs = now - createdAt

  const TEN_MINUTES = 10 * 60 * 1000
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  if (elapsedMs >= TWENTY_FOUR_HOURS) return 'failed'
  if (elapsedMs >= TEN_MINUTES) return 'slow'
  return 'active'
}

interface ChapterCardProps {
  chapter: Chapter
  novelId: string
  index: number
  onRetry?: (chapterId: string) => void
  onDelete?: (chapterId: string) => void
}

export function ChapterCard({ chapter, novelId, index, onRetry, onDelete }: ChapterCardProps) {
  // --- COMPLETED CHAPTER (normal card) ---
  if (chapter.status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
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
    )
  }

  // --- GENERATING / FAILED CHAPTER ---
  const state = getGeneratingState(chapter)
  const rawPreview = chapter.raw_entry?.length > 120
    ? chapter.raw_entry.substring(0, 120) + '...'
    : chapter.raw_entry

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div className={`flex items-start gap-3 p-3 md:p-4 rounded-xl border transition-all duration-200 ${
        state === 'active'
          ? 'border-accent-primary/30 bg-ink-card/50 shadow-glow-sm'
          : state === 'slow'
          ? 'border-amber-500/30 bg-ink-card/50'
          : 'border-red-500/30 bg-ink-card/50'
      }`}>
        {/* Status indicator */}
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-ink-border/30 bg-ink-surface/50">
          {state === 'active' && (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-accent-primary animate-spin" />
          )}
          {state === 'slow' && (
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
          )}
          {state === 'failed' && (
            <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-text-primary">
            Chapter {chapter.chapter_number}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(chapter.entry_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {/* Raw entry preview */}
          <p className="text-sm text-text-secondary mt-2 italic">
            {rawPreview}
          </p>

          {/* Status message */}
          <div className="mt-3">
            {state === 'active' && (
              <div>
                <p className="text-xs text-accent-primary font-ui">Crafting your chapter...</p>
                <div className="mt-2 h-1 w-full bg-ink-border/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-primary/60 to-accent-secondary/60 rounded-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
              </div>
            )}

            {state === 'slow' && (
              <div className="space-y-2">
                <p className="text-xs text-amber-500 font-ui">Taking longer than expected...</p>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(chapter.id)}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Retry Generation
                  </Button>
                )}
              </div>
            )}

            {state === 'failed' && (
              <div className="space-y-2">
                <p className="text-xs text-red-400 font-ui">
                  Sorry, due to a server issue your chapter could not be generated. Please try again.
                </p>
                <div className="flex gap-2">
                  {onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(chapter.id)}
                      className="text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Regenerate
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onDelete(chapter.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3 mr-1.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'

interface QuoteCardProps {
  quote: string
  chapterTitle: string | null
  chapterNumber: number
  chapterId: string
  novelId: string
  mood: string | null
  entryDate: string
  isSaved?: boolean
  index?: number
}

export function QuoteCard({ quote, chapterTitle, chapterNumber, chapterId, novelId, mood, entryDate, isSaved, index = 0 }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/novel/${novelId}/chapter/${chapterId}`}>
        <div className="p-4 md:p-5 rounded-xl glass-card hover:border-accent-primary/30 hover:shadow-glow-sm transition-all duration-300 break-inside-avoid mb-3 group">
          <blockquote className="font-body text-sm md:text-base text-text-primary/90 leading-relaxed italic mb-3">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-ui text-text-muted">
                Ch. {chapterNumber}{chapterTitle ? ` — ${chapterTitle}` : ''}
              </p>
              <p className="text-[10px] text-text-muted/60 mt-0.5">
                {new Date(entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mood && (
                <span className="px-2 py-0.5 rounded-full bg-ink-surface/80 text-[10px] text-text-muted">{mood}</span>
              )}
              {isSaved && <Bookmark className="w-3 h-3 text-accent-primary fill-accent-primary" />}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

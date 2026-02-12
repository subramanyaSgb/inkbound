'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { NovelWithChapterCount } from '@/types'

interface NovelCardProps {
  novel: NovelWithChapterCount
  progress?: { lastChapterId: string; chaptersRead: number; totalChapters: number }
  index?: number
}

const genreGradients: Record<string, string> = {
  literary: 'from-amber-900/40 to-orange-900/20',
  romance: 'from-rose-900/40 to-pink-900/20',
  thriller: 'from-red-900/40 to-slate-900/20',
  fantasy: 'from-purple-900/40 to-indigo-900/20',
  scifi: 'from-cyan-900/40 to-blue-900/20',
  comedy: 'from-yellow-900/40 to-amber-900/20',
  drama: 'from-zinc-800/40 to-stone-900/20',
  mystery: 'from-emerald-900/40 to-teal-900/20',
}

export function NovelCard({ novel, progress, index = 0 }: NovelCardProps) {
  const gradient = genreGradients[novel.genre] || genreGradients.literary
  const progressPercent = progress ? Math.min(100, (progress.chaptersRead / Math.max(1, progress.totalChapters)) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
    >
      <Link href={`/novel/${novel.id}`}>
        <Card hover variant="glass" className="flex flex-row md:flex-col gap-3 group">
          {/* Cover placeholder */}
          <div className={`aspect-square w-16 md:aspect-[3/4] md:w-full flex-shrink-0 rounded-lg bg-gradient-to-br ${gradient} border border-ink-border/50 flex items-center justify-center overflow-hidden relative`}>
            {novel.cover_image_url ? (
              <img
                src={novel.cover_image_url}
                alt={novel.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <span className="font-display text-2xl md:text-4xl text-accent-primary/80">{novel.title.charAt(0)}</span>
                <p className="text-[10px] text-text-muted mt-1 hidden md:block">{novel.genre}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base md:text-lg text-text-primary truncate group-hover:text-accent-primary transition-colors">{novel.title}</h3>
            <p className="text-sm text-text-secondary flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Ch. {novel.chapter_count}
              {novel.volume_count > 0 && ` · Vol ${novel.volume_count}`}
            </p>
            {novel.latest_chapter_date && (
              <p className="text-xs text-text-muted mt-1">
                Last: {new Date(novel.latest_chapter_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {progress && (
            <div className="mt-2 pt-2 border-t border-ink-border/50">
              <div className="w-full h-1.5 bg-ink-surface rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">{Math.round(progressPercent)}%</span>
                <a
                  href={`/novel/${novel.id}/chapter/${progress.lastChapterId}`}
                  className="text-xs font-ui text-accent-primary hover:text-accent-primary/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Continue reading
                </a>
              </div>
            </div>
          )}
        </Card>
      </Link>
    </motion.div>
  )
}

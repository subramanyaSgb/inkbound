'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import type { NovelWithChapterCount } from '@/types'

interface NovelCardProps {
  novel: NovelWithChapterCount
  progress?: { lastChapterId: string; chaptersRead: number; totalChapters: number }
}

export function NovelCard({ novel, progress }: NovelCardProps) {
  return (
    <Link href={`/novel/${novel.id}`}>
      <Card hover className="flex flex-row md:flex-col gap-3">
        {/* Cover placeholder */}
        <div className="aspect-square w-16 md:aspect-[3/4] md:w-full flex-shrink-0 rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center overflow-hidden">
          {novel.cover_image_url ? (
            <img
              src={novel.cover_image_url}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <p className="font-display text-sm md:text-lg text-accent-primary">{novel.title}</p>
              <p className="text-xs text-text-muted mt-1">{novel.genre}</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="font-display text-base md:text-lg text-text-primary truncate">{novel.title}</h3>
          <p className="text-sm text-text-secondary">
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
          <div className="mt-2 pt-2 border-t border-ink-border">
            <div className="w-full h-1 bg-ink-surface rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-accent-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, (progress.chaptersRead / Math.max(1, progress.totalChapters)) * 100)}%` }}
              />
            </div>
            <a
              href={`/novel/${novel.id}/chapter/${progress.lastChapterId}`}
              className="text-xs font-ui text-accent-primary hover:text-accent-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              Continue reading
            </a>
          </div>
        )}
      </Card>
    </Link>
  )
}

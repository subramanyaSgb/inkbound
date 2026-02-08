'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import type { NovelWithChapterCount } from '@/types'

export function NovelCard({ novel }: { novel: NovelWithChapterCount }) {
  return (
    <Link href={`/novel/${novel.id}`}>
      <Card hover className="flex flex-col gap-3">
        {/* Cover placeholder */}
        <div className="aspect-[3/4] w-full rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center overflow-hidden">
          {novel.cover_image_url ? (
            <img
              src={novel.cover_image_url}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <p className="font-display text-lg text-accent-primary">{novel.title}</p>
              <p className="text-xs text-text-muted mt-1">{novel.genre}</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="font-display text-lg text-text-primary truncate">{novel.title}</h3>
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
      </Card>
    </Link>
  )
}

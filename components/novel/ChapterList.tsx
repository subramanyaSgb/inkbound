'use client'

import { createClient } from '@/lib/supabase/client'
import { ChapterCard } from '@/components/novel/ChapterCard'
import type { Chapter } from '@/types'

interface ChapterListProps {
  chapters: Chapter[]
  novelId: string
  onChaptersChanged?: () => void
}

export function ChapterList({ chapters, novelId, onChaptersChanged }: ChapterListProps) {
  const supabase = createClient()

  async function handleRetry(chapterId: string) {
    // Reset chapter to 'generating' and trigger process
    await fetch('/api/generate-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, chapterId }),
    })

    // Fire background generation
    fetch('/api/process-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId }),
      keepalive: true,
    }).catch(() => {})

    onChaptersChanged?.()
  }

  async function handleDelete(chapterId: string) {
    await supabase
      .from('chapters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chapterId)

    onChaptersChanged?.()
  }

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
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          novelId={novelId}
          index={i}
          onRetry={handleRetry}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}

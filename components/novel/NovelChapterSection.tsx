'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChapterList } from '@/components/novel/ChapterList'
import { createClient } from '@/lib/supabase/client'
import type { Chapter } from '@/types'

interface NovelChapterSectionProps {
  initialChapters: Chapter[]
  novelId: string
}

export function NovelChapterSection({ initialChapters, novelId }: NovelChapterSectionProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const supabase = createClient()

  const hasGenerating = chapters.some(ch => ch.status === 'generating')

  const refreshChapters = useCallback(async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .order('chapter_number', { ascending: false })

    if (data) {
      setChapters(data)
    }
  }, [supabase, novelId])

  // Poll every 10s when there are generating chapters
  useEffect(() => {
    if (!hasGenerating) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chapter-status?novelId=${novelId}`)
        if (res.ok) {
          const data = await res.json()
          const stillGenerating = (data.chapters || []).some(
            (ch: { status: string }) => ch.status === 'generating'
          )
          // If any chapter changed status, refresh the full list
          if (!stillGenerating || data.chapters.length !== chapters.filter(c => c.status !== 'completed').length) {
            await refreshChapters()
          }
        }
      } catch {
        // Polling error, keep trying
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [hasGenerating, novelId, refreshChapters, chapters])

  return (
    <ChapterList
      chapters={chapters}
      novelId={novelId}
      onChaptersChanged={refreshChapters}
    />
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChapterPageClient } from '@/components/novel/ChapterPageClient'
import { Button } from '@/components/ui/Button'
import type { Chapter, AlternateChapter } from '@/types'

export default async function ChapterPage({
  params,
}: {
  params: { novelId: string; chapterId: string }
}) {
  const supabase = await createClient()
  const { novelId, chapterId } = params

  let chapter: Chapter | null = null
  try {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('novel_id', novelId)
      .single()
    chapter = data
  } catch {
    notFound()
  }

  if (!chapter) notFound()

  // If chapter is still generating or failed, redirect to novel page
  if (chapter.status !== 'completed') {
    const { redirect } = await import('next/navigation')
    redirect(`/novel/${novelId}`)
  }

  // Auto-track reading progress (non-critical, silently continue on failure)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          novel_id: novelId,
          last_chapter_id: chapterId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,novel_id' })
    }
  } catch {
    // Reading progress update failed — silently continue
  }

  // Fetch alternate universe versions
  let alternates: AlternateChapter[] = []
  try {
    const { data } = await supabase
      .from('alternate_chapters')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true })
    alternates = data || []
  } catch {
    // Non-critical
  }

  let prevChapter: { id: string } | null = null
  let nextChapter: { id: string } | null = null

  try {
    const [prevResult, nextResult] = await Promise.all([
      supabase
        .from('chapters')
        .select('id')
        .eq('novel_id', novelId)
        .is('deleted_at', null)
        .lt('chapter_number', chapter.chapter_number)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('chapters')
        .select('id')
        .eq('novel_id', novelId)
        .is('deleted_at', null)
        .gt('chapter_number', chapter.chapter_number)
        .order('chapter_number', { ascending: true })
        .limit(1)
        .single(),
    ])
    prevChapter = prevResult.data
    nextChapter = nextResult.data
  } catch {
    // Navigation failed — prev/next will just not show
  }

  return (
    <div className="max-w-3xl mx-auto pb-8 md:pb-12">
      <Link
        href={`/novel/${novelId}`}
        className="text-xs md:text-sm text-text-muted hover:text-text-secondary mb-4 md:mb-8 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        All Chapters
      </Link>

      <ChapterPageClient chapter={chapter} novelId={novelId} alternates={alternates} />

      <div className="flex justify-between mt-8 md:mt-12">
        {prevChapter ? (
          <Link href={`/novel/${novelId}/chapter/${prevChapter.id}`}>
            <Button variant="ghost" className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Previous
            </Button>
          </Link>
        ) : <div />}
        {nextChapter ? (
          <Link href={`/novel/${novelId}/chapter/${nextChapter.id}`}>
            <Button variant="ghost" className="flex items-center gap-1.5">
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Button>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}

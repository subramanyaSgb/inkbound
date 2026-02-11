import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChapterReader } from '@/components/novel/ChapterReader'
import { Button } from '@/components/ui/Button'

export default async function ChapterPage({
  params,
}: {
  params: { novelId: string; chapterId: string }
}) {
  const supabase = await createClient()
  const { novelId, chapterId } = params

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('novel_id', novelId)
    .single()

  if (!chapter) notFound()

  const { data: prevChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('novel_id', novelId)
    .is('deleted_at', null)
    .lt('chapter_number', chapter.chapter_number)
    .order('chapter_number', { ascending: false })
    .limit(1)
    .single()

  const { data: nextChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('novel_id', novelId)
    .is('deleted_at', null)
    .gt('chapter_number', chapter.chapter_number)
    .order('chapter_number', { ascending: true })
    .limit(1)
    .single()

  return (
    <div className="max-w-3xl mx-auto pb-8 md:pb-12">
      <Link
        href={`/novel/${novelId}`}
        className="text-xs md:text-sm text-text-muted hover:text-text-secondary mb-4 md:mb-8 inline-block"
      >
        &larr; All Chapters
      </Link>

      <ChapterReader chapter={chapter} novelId={novelId} />

      <div className="flex justify-between mt-6 md:mt-12">
        {prevChapter ? (
          <Link href={`/novel/${novelId}/chapter/${prevChapter.id}`}>
            <Button variant="ghost">&larr; Previous</Button>
          </Link>
        ) : <div />}
        {nextChapter ? (
          <Link href={`/novel/${novelId}/chapter/${nextChapter.id}`}>
            <Button variant="ghost">Next &rarr;</Button>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}

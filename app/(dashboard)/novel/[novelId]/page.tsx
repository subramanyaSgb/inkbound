import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChapterList } from '@/components/novel/ChapterList'
import { Button } from '@/components/ui/Button'

export default async function NovelDetailPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  const { data: novel } = await supabase
    .from('novels')
    .select('*')
    .eq('id', novelId)
    .single()

  if (!novel) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .order('chapter_number', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-block">
          &larr; Library
        </Link>
        <h1 className="font-display text-3xl text-text-primary">{novel.title}</h1>
        <p className="text-text-secondary mt-1">
          {novel.genre} &middot; {novel.pov} person &middot; {novel.writing_style} style
        </p>
        {novel.description && (
          <p className="text-text-muted text-sm mt-2">{novel.description}</p>
        )}
      </div>

      <div className="flex gap-3 mb-8">
        <Link href={`/write?novelId=${novelId}`}>
          <Button>Write Today&apos;s Entry</Button>
        </Link>
        <Link href={`/novel/${novelId}/settings`}>
          <Button variant="secondary">Settings</Button>
        </Link>
      </div>

      <h2 className="font-display text-xl text-text-primary mb-4">Chapters</h2>
      <ChapterList chapters={chapters || []} novelId={novelId} />
    </div>
  )
}

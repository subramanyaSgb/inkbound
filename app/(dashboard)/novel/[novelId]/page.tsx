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
    .is('deleted_at', null)
    .order('chapter_number', { ascending: false })

  const { count: deletedCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('novel_id', novelId)
    .not('deleted_at', 'is', null)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero section */}
      <div className="mb-6 md:mb-8">
        <Link href="/" className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-flex items-center gap-1 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Library
        </Link>
        <h1 className="font-display text-2xl md:text-4xl text-text-primary mt-2">{novel.title}</h1>
        <p className="text-text-secondary mt-1.5 flex items-center gap-2 flex-wrap text-sm">
          <span className="px-2 py-0.5 rounded-full bg-ink-highlight text-accent-primary text-xs">{novel.genre}</span>
          <span>{novel.pov} person</span>
          <span className="text-text-muted">&middot;</span>
          <span>{novel.writing_style} style</span>
        </p>
        {novel.description && (
          <p className="text-text-muted text-sm mt-2">{novel.description}</p>
        )}
      </div>

      <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 flex-wrap">
        <Link href={`/write?novelId=${novelId}`}>
          <Button variant="glow">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Write Today&apos;s Entry
          </Button>
        </Link>
        <Link href={`/novel/${novelId}/settings`}>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </Button>
        </Link>
        <Link href={`/novel/${novelId}/stats`}>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Stats
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="font-display text-lg md:text-xl text-text-primary flex items-center gap-2">
          Chapters
          <span className="text-xs font-ui text-text-muted bg-ink-surface px-2 py-0.5 rounded-full">{chapters?.length || 0}</span>
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href={`/novel/${novelId}/search`}
            className="text-xs font-ui text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search
          </Link>
          {(deletedCount ?? 0) > 0 && (
            <Link
              href={`/novel/${novelId}/bin`}
              className="text-xs font-ui text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Bin ({deletedCount})
            </Link>
          )}
        </div>
      </div>
      <ChapterList chapters={chapters || []} novelId={novelId} />
    </div>
  )
}

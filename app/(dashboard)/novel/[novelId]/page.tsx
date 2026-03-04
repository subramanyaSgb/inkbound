import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NovelChapterSection } from '@/components/novel/NovelChapterSection'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, Pen, Settings, BarChart3, Quote, Users, Search, Trash2, Sparkles } from 'lucide-react'
import type { Chapter, Novel } from '@/types'

export default async function NovelDetailPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  // Run all 3 queries in parallel instead of sequentially
  let novel: Novel | null = null
  let chapters: Chapter[] = []
  let deletedCount: number | null = 0

  try {
    const [novelResult, chaptersResult, deletedResult] = await Promise.all([
      supabase.from('novels').select('*').eq('id', novelId).single(),
      supabase.from('chapters').select('*').eq('novel_id', novelId).is('deleted_at', null).order('chapter_number', { ascending: false }),
      supabase.from('chapters').select('*', { count: 'exact', head: true }).eq('novel_id', novelId).not('deleted_at', 'is', null),
    ])

    novel = novelResult.data
    chapters = chaptersResult.data || []
    deletedCount = deletedResult.count
  } catch {
    // If the parallel fetch fails entirely, try to fetch just the novel
    try {
      const { data } = await supabase.from('novels').select('*').eq('id', novelId).single()
      novel = data
    } catch {
      notFound()
    }
  }

  if (!novel) notFound()

  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Ambient glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-accent-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      {/* Hero section */}
      <div className="relative mb-6 md:mb-8 animate-enter">
        <Link href="/" className="text-sm text-text-muted hover:text-accent-primary/70 mb-4 inline-flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Library
        </Link>
        {novel.cover_image_url && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-ink-border/30 mb-4 mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={novel.cover_image_url} alt={novel.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-bg via-ink-bg/60 to-transparent" />
          </div>
        )}
        <h1 className="font-display text-2xl md:text-4xl text-gradient mt-2 leading-tight">{novel.title}</h1>
        <p className="text-text-secondary mt-2 flex items-center gap-2 flex-wrap text-sm">
          <span className="px-2.5 py-0.5 rounded-full bg-accent-primary/[0.08] text-accent-primary text-xs border border-accent-primary/15">{novel.genre}</span>
          <span className="text-text-muted">{novel.pov} person</span>
          <span className="text-ink-border">·</span>
          <span className="text-text-muted">{novel.writing_style} style</span>
        </p>
        {novel.description && (
          <p className="text-text-muted text-sm mt-2 font-body italic">{novel.description}</p>
        )}
      </div>

      <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 flex-wrap animate-enter animate-enter-1">
        <Link href={`/write?novelId=${novelId}`}>
          <Button variant="glow">
            <Pen className="w-4 h-4 mr-1.5" />
            Write Today&apos;s Entry
          </Button>
        </Link>
        <Link href={`/novel/${novelId}/settings`}>
          <Button variant="outline"><Settings className="w-4 h-4 mr-1.5" />Settings</Button>
        </Link>
        <Link href={`/novel/${novelId}/stats`}>
          <Button variant="outline"><BarChart3 className="w-4 h-4 mr-1.5" />Stats</Button>
        </Link>
        <Link href={`/novel/${novelId}/quotes`}>
          <Button variant="outline"><Quote className="w-4 h-4 mr-1.5" />Quotes</Button>
        </Link>
        <Link href={`/novel/${novelId}/characters`}>
          <Button variant="outline"><Users className="w-4 h-4 mr-1.5" />Characters</Button>
        </Link>
      </div>

      {/* Ornamental divider */}
      <div className="flex items-center gap-3 mb-5 animate-enter animate-enter-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        <Sparkles className="w-3 h-3 text-accent-primary/30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
      </div>

      <div className="flex items-center justify-between mb-3 md:mb-4 animate-enter animate-enter-3">
        <h2 className="font-display text-lg md:text-xl text-text-primary flex items-center gap-2">
          Chapters
          <span className="text-[10px] font-ui text-accent-primary/60 bg-accent-primary/[0.07] px-2 py-0.5 rounded-full">{chapters?.length || 0}</span>
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href={`/novel/${novelId}/search`}
            className="text-xs font-ui text-text-muted hover:text-accent-primary/70 transition-colors flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </Link>
          {(deletedCount ?? 0) > 0 && (
            <Link
              href={`/novel/${novelId}/bin`}
              className="text-xs font-ui text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bin ({deletedCount})
            </Link>
          )}
        </div>
      </div>
      <div className="animate-enter animate-enter-4">
        <NovelChapterSection initialChapters={chapters || []} novelId={novelId} />
      </div>
    </div>
  )
}

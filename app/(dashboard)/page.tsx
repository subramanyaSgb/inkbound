import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NovelCard } from '@/components/novel/NovelCard'
import { Button } from '@/components/ui/Button'
import type { NovelWithChapterCount } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch novels, chapters summary, and reading progress in parallel (3 queries instead of 3N+1)
  const [novelsResult, progressResult] = await Promise.all([
    supabase
      .from('novels')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('reading_progress')
      .select('novel_id, last_chapter_id, chapters_read'),
  ])

  const novels = novelsResult.data || []
  const novelIds = novels.map(n => n.id)

  // Fetch all chapters (only needed fields) and volumes in parallel for all novels at once
  const [chaptersResult, volumesResult] = novelIds.length > 0
    ? await Promise.all([
        supabase
          .from('chapters')
          .select('novel_id, entry_date')
          .in('novel_id', novelIds)
          .is('deleted_at', null)
          .order('entry_date', { ascending: false }),
        supabase
          .from('volumes')
          .select('novel_id')
          .in('novel_id', novelIds),
      ])
    : [{ data: [] }, { data: [] }]

  // Compute counts from fetched data (in-memory, no extra queries)
  const chaptersByNovel: Record<string, { count: number; latestDate: string | null }> = {}
  for (const ch of chaptersResult.data || []) {
    if (!chaptersByNovel[ch.novel_id]) {
      chaptersByNovel[ch.novel_id] = { count: 0, latestDate: ch.entry_date }
    }
    chaptersByNovel[ch.novel_id].count++
  }

  const volumeCountByNovel: Record<string, number> = {}
  for (const v of volumesResult.data || []) {
    volumeCountByNovel[v.novel_id] = (volumeCountByNovel[v.novel_id] || 0) + 1
  }

  const novelsWithCounts: NovelWithChapterCount[] = novels.map(novel => ({
    ...novel,
    chapter_count: chaptersByNovel[novel.id]?.count || 0,
    latest_chapter_date: chaptersByNovel[novel.id]?.latestDate || null,
    volume_count: volumeCountByNovel[novel.id] || 0,
  }))

  // Build reading progress map
  const progressMap: Record<string, { lastChapterId: string; chaptersRead: number; totalChapters: number }> = {}
  for (const p of progressResult.data || []) {
    if (p.last_chapter_id) {
      progressMap[p.novel_id] = {
        lastChapterId: p.last_chapter_id,
        chaptersRead: p.chapters_read ?? 0,
        totalChapters: chaptersByNovel[p.novel_id]?.count ?? 0,
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h1 className="font-display text-xl md:text-3xl text-text-primary">Your Library</h1>
          <p className="text-xs text-text-muted mt-0.5 hidden md:block">
            {novelsWithCounts.length} novel{novelsWithCounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/novel/new">
          <Button variant="glow">+ New Novel</Button>
        </Link>
      </div>

      {novelsWithCounts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl md:text-3xl text-text-secondary mb-2">Begin your story</p>
          <p className="text-text-muted mb-8 max-w-sm mx-auto">
            Create your first novel and turn your everyday life into a beautifully written narrative.
          </p>
          <Link href="/novel/new">
            <Button size="lg" variant="glow">Create Your First Novel</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {novelsWithCounts.map((novel, i) => (
            <NovelCard key={novel.id} novel={novel} progress={progressMap[novel.id]} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

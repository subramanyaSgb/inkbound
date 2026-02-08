import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NovelCard } from '@/components/novel/NovelCard'
import { Button } from '@/components/ui/Button'
import type { NovelWithChapterCount } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: novels } = await supabase
    .from('novels')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  // Get chapter counts for each novel
  const novelsWithCounts: NovelWithChapterCount[] = await Promise.all(
    (novels || []).map(async (novel) => {
      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novel.id)

      const { data: latestChapter } = await supabase
        .from('chapters')
        .select('entry_date')
        .eq('novel_id', novel.id)
        .order('entry_date', { ascending: false })
        .limit(1)
        .single()

      const { count: volumeCount } = await supabase
        .from('volumes')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novel.id)

      return {
        ...novel,
        chapter_count: count || 0,
        latest_chapter_date: latestChapter?.entry_date || null,
        volume_count: volumeCount || 0,
      }
    })
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-text-primary">Your Library</h1>
        <Link href="/novel/new">
          <Button>+ New Novel</Button>
        </Link>
      </div>

      {novelsWithCounts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl text-text-secondary mb-2">No novels yet</p>
          <p className="text-text-muted mb-6">Start your first novel and turn your life into a story.</p>
          <Link href="/novel/new">
            <Button size="lg">Create Your First Novel</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {novelsWithCounts.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      )}
    </div>
  )
}

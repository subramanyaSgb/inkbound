import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeMoodArc, computeTagCounts, computeSoundtrackCounts, computeWordStats, computeStreak } from '@/lib/stats'
import { StreakBanner } from '@/components/stats/StreakBanner'
import { MoodArcChart } from '@/components/stats/MoodArcChart'
import { MoodCalendar } from '@/components/stats/MoodCalendar'
import { WordStats } from '@/components/stats/WordStats'
import { TagCloud } from '@/components/stats/TagCloud'
import { TopSoundtracks } from '@/components/stats/TopSoundtracks'
import { BestQuotes } from '@/components/stats/BestQuotes'
import { GenreOfYourLife } from '@/components/stats/GenreOfYourLife'

export default async function NovelStatsPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  const { data: novel } = await supabase
    .from('novels')
    .select('title')
    .eq('id', novelId)
    .single()

  if (!novel) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .is('deleted_at', null)
    .order('entry_date', { ascending: true })

  const allChapters = chapters || []
  const moodData = computeMoodArc(allChapters)
  const tags = computeTagCounts(allChapters)
  const soundtracks = computeSoundtrackCounts(allChapters)
  const wordStats = computeWordStats(allChapters)
  const streak = computeStreak(allChapters)

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Novel
      </Link>
      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-1">{novel.title}</h1>
      <p className="text-xs text-text-muted mb-4 md:mb-6">Your story in numbers</p>

      <div className="space-y-3 md:space-y-4">
        <StreakBanner current={streak.current} longest={streak.longest} total={streak.total} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <MoodArcChart data={moodData} />
          <MoodCalendar chapters={allChapters} />
        </div>

        <WordStats {...wordStats} />
        <GenreOfYourLife novelId={novelId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <TagCloud tags={tags} />
          <TopSoundtracks soundtracks={soundtracks} />
        </div>

        <BestQuotes chapters={allChapters} />
      </div>
    </div>
  )
}

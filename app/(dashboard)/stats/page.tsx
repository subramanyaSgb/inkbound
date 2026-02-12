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
import type { Chapter } from '@/types'

export default async function GlobalStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: novels } = await supabase
    .from('novels')
    .select('id')
    .eq('user_id', user!.id)

  const novelIds = (novels || []).map(n => n.id)

  let allChapters: Chapter[] = []
  if (novelIds.length > 0) {
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .in('novel_id', novelIds)
      .is('deleted_at', null)
      .order('entry_date', { ascending: true })
    allChapters = chapters || []
  }

  const moodData = computeMoodArc(allChapters)
  const tags = computeTagCounts(allChapters)
  const soundtracks = computeSoundtrackCounts(allChapters)
  const wordStats = computeWordStats(allChapters)
  const streak = computeStreak(allChapters)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-1">Life Stats</h1>
      <p className="text-xs text-text-muted mb-4 md:mb-6">Across all your novels</p>

      <div className="space-y-3 md:space-y-4">
        <StreakBanner current={streak.current} longest={streak.longest} total={streak.total} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <MoodArcChart data={moodData} />
          <MoodCalendar chapters={allChapters} />
        </div>

        <WordStats {...wordStats} />
        <GenreOfYourLife />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <TagCloud tags={tags} />
          <TopSoundtracks soundtracks={soundtracks} />
        </div>

        <BestQuotes chapters={allChapters} />
      </div>
    </div>
  )
}

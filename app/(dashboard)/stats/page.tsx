import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeMoodArc, computeTagCounts, computeWordStats, computeStreak } from '@/lib/stats'
import { StreakBanner } from '@/components/stats/StreakBanner'
import { MoodArcChart } from '@/components/stats/MoodArcChart'
import { MoodCalendar } from '@/components/stats/MoodCalendar'
import { WordStats } from '@/components/stats/WordStats'
import { TagCloud } from '@/components/stats/TagCloud'
import { BestQuotes } from '@/components/stats/BestQuotes'
import { GenreOfYourLife } from '@/components/stats/GenreOfYourLife'
import { Sparkles } from 'lucide-react'
import type { Chapter } from '@/types'

export default async function GlobalStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let allChapters: Chapter[] = []

  try {
    const { data: novels } = await supabase
      .from('novels')
      .select('id')
      .eq('user_id', user.id)

    const novelIds = (novels || []).map(n => n.id)

    if (novelIds.length > 0) {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, novel_id, entry_date, title, chapter_number, mood, mood_score, tags, word_count, deleted_at')
        .in('novel_id', novelIds)
        .is('deleted_at', null)
        .order('entry_date', { ascending: true })
      allChapters = (chapters || []) as Chapter[]
    }
  } catch {
    // If queries fail, show empty stats
    allChapters = []
  }

  const moodData = computeMoodArc(allChapters)
  const tags = computeTagCounts(allChapters)
  const wordStats = computeWordStats(allChapters)
  const streak = computeStreak(allChapters)

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-accent-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <p className="font-body text-sm text-accent-primary/70 italic">Your journey in numbers</p>
      <h1 className="font-display text-2xl md:text-3xl text-gradient mb-1">Life Stats</h1>
      <p className="text-xs text-text-muted mb-4 md:mb-6">Across all your novels</p>

      <div className="flex items-center gap-3 mt-5 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        <Sparkles className="w-3 h-3 text-accent-primary/30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
      </div>

      <div className="space-y-3 md:space-y-4 animate-enter">
        <StreakBanner current={streak.current} longest={streak.longest} total={streak.total} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 animate-enter animate-enter-2">
          <MoodArcChart data={moodData} />
          <MoodCalendar chapters={allChapters} />
        </div>

        <WordStats {...wordStats} />
        <GenreOfYourLife />

        <TagCloud tags={tags} />

        <BestQuotes chapters={allChapters} />
      </div>
    </div>
  )
}

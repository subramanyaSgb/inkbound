import type { Chapter } from '@/types'

export interface MoodDataPoint {
  date: string
  score: number
  title: string
  mood: string
}

export interface TagCount {
  tag: string
  count: number
}

export interface SoundtrackCount {
  song: string
  artist: string
  count: number
}

export interface DayStats {
  date: string
  score: number | null
  title: string | null
}

export function computeMoodArc(chapters: Chapter[], days?: number): MoodDataPoint[] {
  let filtered = chapters
    .filter(c => c.mood_score !== null && !c.deleted_at)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())

  if (days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    filtered = filtered.filter(c => new Date(c.entry_date) >= cutoff)
  }

  return filtered.map(c => ({
    date: c.entry_date,
    score: c.mood_score!,
    title: c.title || `Chapter ${c.chapter_number}`,
    mood: c.mood || '',
  }))
}

export function computeTagCounts(chapters: Chapter[]): TagCount[] {
  const counts: Record<string, number> = {}
  chapters.filter(c => !c.deleted_at).forEach(c => {
    c.tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1
    })
  })
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

export function computeSoundtrackCounts(chapters: Chapter[]): SoundtrackCount[] {
  const counts: Record<string, { song: string; artist: string; count: number }> = {}
  chapters.filter(c => !c.deleted_at && c.soundtrack_suggestion).forEach(c => {
    const parts = c.soundtrack_suggestion!.split(' by ')
    if (parts.length === 2) {
      const key = c.soundtrack_suggestion!.toLowerCase()
      if (!counts[key]) {
        counts[key] = { song: parts[0].trim(), artist: parts[1].trim(), count: 0 }
      }
      counts[key].count++
    }
  })
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10)
}

export function computeWordStats(chapters: Chapter[]) {
  const active = chapters.filter(c => !c.deleted_at)
  const totalWords = active.reduce((sum, c) => sum + c.word_count, 0)
  const longest = active.length > 0 ? active.reduce((max, c) => c.word_count > max.word_count ? c : max, active[0]) : null
  return {
    totalChapters: active.length,
    totalWords,
    avgWords: active.length > 0 ? Math.round(totalWords / active.length) : 0,
    longestChapter: longest,
  }
}

export function computeStreak(chapters: Chapter[]): { current: number; longest: number; total: number } {
  const dates = [...new Set(
    chapters.filter(c => !c.deleted_at).map(c => c.entry_date)
  )].sort()

  if (dates.length === 0) return { current: 0, longest: 0, total: 0 }

  let current = 1
  let longest = 1
  let streak = 1

  for (let i = dates.length - 1; i > 0; i--) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      streak++
      if (i === dates.length - 1 || i === dates.length - streak + 1) current = streak
    } else {
      streak = 1
    }
    longest = Math.max(longest, streak)
  }

  const lastDate = new Date(dates[dates.length - 1])
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)
  const daysSinceLast = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceLast > 1) current = 0

  return { current, longest, total: dates.length }
}

export function computeCalendarData(chapters: Chapter[], year: number, month: number): DayStats[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result: DayStats[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const chapter = chapters.find(c => c.entry_date === dateStr && !c.deleted_at)
    result.push({
      date: dateStr,
      score: chapter?.mood_score ?? null,
      title: chapter?.title ?? null,
    })
  }

  return result
}

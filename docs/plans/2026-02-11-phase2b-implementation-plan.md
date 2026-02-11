# Phase 2B — Stats Dashboard, Reading Progress + Search, Guided Conversation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a life stats dashboard with 8 widgets, reading progress tracking with chapter search, and a guided conversation entry mode with streaming AI chat.

**Architecture:** Three independent features sharing the existing Supabase + Next.js stack. Stats Dashboard uses Recharts for visualizations on two pages (global + per-novel). Reading Progress adds a DB table and auto-tracking on chapter open. Guided Conversation adds a streaming chat API endpoint and WhatsApp-style chat UI.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Recharts, NVIDIA API (Kimi K2.5), Server-Sent Events

---

## Feature 1: Life Stats Dashboard (Tasks 1-8)

### Task 1: Install Recharts + Create Stats Utility Functions

**Files:**
- Modify: `package.json` (add recharts dependency)
- Create: `lib/stats.ts`

**Step 1: Install recharts**

Run:
```bash
npm install recharts
```

**Step 2: Create stats utility functions**

Create `lib/stats.ts`:

```typescript
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
  const longest = active.reduce((max, c) => c.word_count > max.word_count ? c : max, active[0])
  return {
    totalChapters: active.length,
    totalWords,
    avgWords: active.length > 0 ? Math.round(totalWords / active.length) : 0,
    longestChapter: longest || null,
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

  // Check if current streak is still active (last entry was today or yesterday)
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
```

**Step 3: Commit**

```bash
git add lib/stats.ts package.json package-lock.json
git commit -m "feat: install recharts and add stats utility functions"
```

---

### Task 2: Create Stats Widget Components (Part 1 — Streak, Word Stats, Mood Arc)

**Files:**
- Create: `components/stats/StreakBanner.tsx`
- Create: `components/stats/WordStats.tsx`
- Create: `components/stats/MoodArcChart.tsx`

**Step 1: Create StreakBanner**

Create `components/stats/StreakBanner.tsx`:

```tsx
import { Card } from '@/components/ui/Card'

interface StreakBannerProps {
  current: number
  longest: number
  total: number
}

export function StreakBanner({ current, longest, total }: StreakBannerProps) {
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl md:text-3xl">{current > 0 ? '/' : '.'}</span>
        <div>
          <p className="font-display text-2xl md:text-3xl text-accent-primary">{current}</p>
          <p className="text-xs text-text-muted font-ui">day streak</p>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="text-center">
          <p className="font-display text-lg text-text-primary">{longest}</p>
          <p className="text-xs text-text-muted font-ui">best</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg text-text-primary">{total}</p>
          <p className="text-xs text-text-muted font-ui">entries</p>
        </div>
      </div>
    </Card>
  )
}
```

**Step 2: Create WordStats**

Create `components/stats/WordStats.tsx`:

```tsx
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

interface WordStatsProps {
  totalChapters: number
  totalWords: number
  avgWords: number
  longestChapter: { id: string; novel_id: string; word_count: number; title: string | null } | null
}

export function WordStats({ totalChapters, totalWords, avgWords, longestChapter }: WordStatsProps) {
  const stats = [
    { label: 'Chapters', value: totalChapters },
    { label: 'Total Words', value: totalWords.toLocaleString() },
    { label: 'Avg / Chapter', value: avgWords.toLocaleString() },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(s => (
        <Card key={s.label} className="text-center">
          <p className="font-display text-xl md:text-2xl text-text-primary">{s.value}</p>
          <p className="text-xs text-text-muted font-ui mt-1">{s.label}</p>
        </Card>
      ))}
      {longestChapter && (
        <Link href={`/novel/${longestChapter.novel_id}/chapter/${longestChapter.id}`}>
          <Card hover className="text-center h-full flex flex-col justify-center">
            <p className="font-display text-xl md:text-2xl text-text-primary">{longestChapter.word_count.toLocaleString()}</p>
            <p className="text-xs text-text-muted font-ui mt-1">Longest</p>
          </Card>
        </Link>
      )}
    </div>
  )
}
```

**Step 3: Create MoodArcChart**

Create `components/stats/MoodArcChart.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { MoodDataPoint } from '@/lib/stats'

interface MoodArcChartProps {
  data: MoodDataPoint[]
  allData: MoodDataPoint[]
}

const ranges = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 0 },
]

export function MoodArcChart({ data: initialData, allData }: MoodArcChartProps) {
  const [activeRange, setActiveRange] = useState('All')

  const filtered = activeRange === 'All'
    ? allData
    : (() => {
        const days = ranges.find(r => r.label === activeRange)?.days || 0
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        return allData.filter(d => new Date(d.date) >= cutoff)
      })()

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base md:text-lg text-text-primary">Mood Arc</h3>
        <div className="flex gap-1">
          {ranges.map(r => (
            <button
              key={r.label}
              onClick={() => setActiveRange(r.label)}
              className={`px-2 py-1 text-xs font-ui rounded transition-colors ${
                activeRange === r.label
                  ? 'bg-ink-highlight text-accent-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length < 2 ? (
        <p className="text-sm text-text-muted text-center py-8">Need at least 2 entries to show mood arc.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C4956A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C4956A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="#6B5F52"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis domain={[0, 1]} hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1620', border: '1px solid #2E2836', borderRadius: 8, fontSize: 12 }}
              labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              formatter={(value: number, _name: string, props: { payload: MoodDataPoint }) => [
                `${props.payload.mood} (${(value * 100).toFixed(0)}%)`,
                props.payload.title,
              ]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#C4956A"
              strokeWidth={2}
              fill="url(#moodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add components/stats/
git commit -m "feat: add streak banner, word stats, and mood arc chart widgets"
```

---

### Task 3: Create Stats Widget Components (Part 2 — Calendar, Tags, Soundtracks)

**Files:**
- Create: `components/stats/MoodCalendar.tsx`
- Create: `components/stats/TagCloud.tsx`
- Create: `components/stats/TopSoundtracks.tsx`

**Step 1: Create MoodCalendar**

Create `components/stats/MoodCalendar.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { DayStats } from '@/lib/stats'
import { computeCalendarData } from '@/lib/stats'
import type { Chapter } from '@/types'

interface MoodCalendarProps {
  chapters: Chapter[]
}

function moodColor(score: number | null): string {
  if (score === null) return 'bg-ink-surface'
  if (score < 0.3) return 'bg-mood-negative/60'
  if (score < 0.6) return 'bg-accent-primary/40'
  return 'bg-mood-positive/60'
}

export function MoodCalendar({ chapters }: MoodCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const days = computeCalendarData(chapters, year, month)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const [tooltip, setTooltip] = useState<DayStats | null>(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base md:text-lg text-text-primary">Mood Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="text-text-muted hover:text-text-primary text-sm px-2">&lt;</button>
          <span className="text-xs font-ui text-text-secondary min-w-[120px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="text-text-muted hover:text-text-primary text-sm px-2">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-text-muted font-ui">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => (
          <button
            key={day.date}
            onClick={() => setTooltip(tooltip?.date === day.date ? null : day)}
            className={`aspect-square rounded-sm ${moodColor(day.score)} transition-colors hover:ring-1 hover:ring-accent-primary/30`}
            title={day.title || undefined}
          />
        ))}
      </div>

      {tooltip && tooltip.title && (
        <div className="mt-3 p-2 rounded-lg bg-ink-surface border border-ink-border">
          <p className="text-xs text-text-secondary font-ui">
            {new Date(tooltip.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-text-primary mt-1">{tooltip.title}</p>
          {tooltip.score !== null && (
            <p className="text-xs text-text-muted mt-1">Mood: {(tooltip.score * 100).toFixed(0)}%</p>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create TagCloud**

Create `components/stats/TagCloud.tsx`:

```tsx
import type { TagCount } from '@/lib/stats'

interface TagCloudProps {
  tags: TagCount[]
}

export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Tags</h3>
        <p className="text-sm text-text-muted text-center py-4">No tags yet.</p>
      </div>
    )
  }

  const maxCount = tags[0].count
  const colors = ['text-accent-primary', 'text-text-primary', 'text-text-secondary', 'text-text-muted']

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 30).map((t, i) => {
          const ratio = t.count / maxCount
          const sizeClass = ratio > 0.7 ? 'text-lg' : ratio > 0.4 ? 'text-base' : 'text-sm'
          const colorClass = colors[Math.min(Math.floor((1 - ratio) * colors.length), colors.length - 1)]
          return (
            <span
              key={t.tag}
              className={`${sizeClass} ${colorClass} font-body cursor-default transition-colors hover:text-accent-primary`}
              title={`${t.count} mentions`}
            >
              #{t.tag}
            </span>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 3: Create TopSoundtracks**

Create `components/stats/TopSoundtracks.tsx`:

```tsx
import type { SoundtrackCount } from '@/lib/stats'

interface TopSoundtracksProps {
  soundtracks: SoundtrackCount[]
}

export function TopSoundtracks({ soundtracks }: TopSoundtracksProps) {
  if (soundtracks.length === 0) {
    return (
      <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Top Soundtracks</h3>
        <p className="text-sm text-text-muted text-center py-4">No soundtracks yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Top Soundtracks</h3>
      <div className="space-y-2">
        {soundtracks.map((s, i) => (
          <div key={`${s.song}-${s.artist}`} className="flex items-center gap-3">
            <span className="text-xs font-ui text-text-muted w-5 text-right">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{s.song}</p>
              <p className="text-xs text-text-muted">{s.artist}</p>
            </div>
            <span className="text-xs text-text-muted font-ui">{s.count}x</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add components/stats/
git commit -m "feat: add mood calendar, tag cloud, and top soundtracks widgets"
```

---

### Task 4: Create Stats Widget Components (Part 3 — Quotes, Genre of Your Life)

**Files:**
- Create: `components/stats/BestQuotes.tsx`
- Create: `components/stats/GenreOfYourLife.tsx`
- Create: `app/api/analyze-genre/route.ts`

**Step 1: Create BestQuotes**

Create `components/stats/BestQuotes.tsx`:

```tsx
import Link from 'next/link'
import type { Chapter } from '@/types'

interface BestQuotesProps {
  chapters: Chapter[]
}

export function BestQuotes({ chapters }: BestQuotesProps) {
  const quotes = chapters
    .filter(c => c.opening_quote && !c.deleted_at)
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, 10)

  if (quotes.length === 0) {
    return (
      <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Best Quotes</h3>
        <p className="text-sm text-text-muted text-center py-4">No quotes yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Best Quotes</h3>
      <div className="space-y-3">
        {quotes.map(c => (
          <Link
            key={c.id}
            href={`/novel/${c.novel_id}/chapter/${c.id}`}
            className="block p-3 rounded-lg bg-ink-surface border border-ink-border hover:border-accent-primary/30 transition-colors"
          >
            <p className="font-body italic text-sm text-text-secondary leading-relaxed">
              &ldquo;{c.opening_quote}&rdquo;
            </p>
            <p className="text-xs text-text-muted mt-2 font-ui">
              {c.title || `Chapter ${c.chapter_number}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create Genre API endpoint**

Create `app/api/analyze-genre/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId } = await request.json()

    // Fetch recent chapters (last 10)
    let query = supabase
      .from('chapters')
      .select('mood, mood_score, tags, title')
      .is('deleted_at', null)
      .order('entry_date', { ascending: false })
      .limit(10)

    if (novelId) {
      query = query.eq('novel_id', novelId)
    }

    const { data: chapters } = await query

    if (!chapters || chapters.length < 3) {
      return NextResponse.json({
        genre: 'Coming Soon',
        explanation: 'Write at least 3 chapters to discover what genre your life resembles.',
      })
    }

    const moods = chapters.map(c => c.mood).filter(Boolean).join(', ')
    const tags = [...new Set(chapters.flatMap(c => c.tags))].join(', ')
    const avgScore = chapters.reduce((s, c) => s + (c.mood_score || 0.5), 0) / chapters.length

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [
          {
            role: 'system',
            content: 'You analyze life story data and determine what literary genre it most resembles. Respond in JSON only: {"genre": "Genre Name", "explanation": "2-3 sentence explanation"}'
          },
          {
            role: 'user',
            content: `Recent moods: ${moods}\nRecurring themes: ${tags}\nAverage mood score: ${(avgScore * 100).toFixed(0)}%\nChapter titles: ${chapters.map(c => c.title).filter(Boolean).join(', ')}\n\nWhat literary genre does this person's recent life most resemble?`
          },
        ],
        max_tokens: 256,
        temperature: 0.8,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error('AI API error')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      genre: 'Literary Fiction',
      explanation: 'Your life reads like a thoughtful literary work — nuanced, layered, and full of quiet revelations.',
    })
  }
}
```

**Step 3: Create GenreOfYourLife component**

Create `components/stats/GenreOfYourLife.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface GenreOfYourLifeProps {
  novelId?: string
}

export function GenreOfYourLife({ novelId }: GenreOfYourLifeProps) {
  const [genre, setGenre] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function analyze() {
    setLoading(true)
    try {
      const res = await fetch('/api/analyze-genre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId }),
      })
      const data = await res.json()
      setGenre(data.genre)
      setExplanation(data.explanation)
    } catch {
      setGenre('Literary Fiction')
      setExplanation('Your life reads like a thoughtful literary work.')
    }
    setLoading(false)
  }

  useEffect(() => { analyze() }, [novelId])

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base md:text-lg text-text-primary">Genre of Your Life</h3>
        <Button variant="ghost" size="sm" onClick={analyze} disabled={loading}>
          {loading ? '...' : 'Refresh'}
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-text-muted py-4 text-center">Analyzing your story...</p>
      ) : (
        <>
          <p className="font-display text-xl md:text-2xl text-accent-primary mb-2">{genre}</p>
          <p className="text-sm text-text-secondary font-body leading-relaxed">{explanation}</p>
        </>
      )}
    </Card>
  )
}
```

**Step 4: Commit**

```bash
git add components/stats/ app/api/analyze-genre/
git commit -m "feat: add best quotes widget and genre-of-your-life AI analysis"
```

---

### Task 5: Create Per-Novel Stats Page

**Files:**
- Create: `app/(dashboard)/novel/[novelId]/stats/page.tsx`
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx` (add Stats link)

**Step 1: Create per-novel stats page**

Create `app/(dashboard)/novel/[novelId]/stats/page.tsx`:

```tsx
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
    <div className="max-w-3xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-block">
        &larr; Back to Novel
      </Link>
      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-1">{novel.title}</h1>
      <p className="text-xs text-text-muted mb-4 md:mb-6">Your story in numbers</p>

      <div className="space-y-3 md:space-y-4">
        <StreakBanner current={streak.current} longest={streak.longest} total={streak.total} />
        <MoodArcChart data={moodData} allData={moodData} />
        <MoodCalendar chapters={allChapters} />
        <WordStats {...wordStats} />
        <GenreOfYourLife novelId={novelId} />
        <TagCloud tags={tags} />
        <TopSoundtracks soundtracks={soundtracks} />
        <BestQuotes chapters={allChapters} />
      </div>
    </div>
  )
}
```

**Step 2: Add Stats link to novel detail page**

Modify `app/(dashboard)/novel/[novelId]/page.tsx`. Add a "Stats" button next to the existing Settings button:

Find this block:
```tsx
<Link href={`/novel/${novelId}/settings`}>
  <Button variant="secondary">Settings</Button>
</Link>
```

Add after it:
```tsx
<Link href={`/novel/${novelId}/stats`}>
  <Button variant="secondary">Stats</Button>
</Link>
```

**Step 3: Commit**

```bash
git add "app/(dashboard)/novel/[novelId]/stats/" "app/(dashboard)/novel/[novelId]/page.tsx"
git commit -m "feat: add per-novel stats page with all 8 widgets"
```

---

### Task 6: Create Global Stats Page + Nav Item

**Files:**
- Create: `app/(dashboard)/stats/page.tsx`
- Modify: `components/layout/Sidebar.tsx` (add Stats nav item)
- Modify: `components/layout/MobileNav.tsx` (add Stats nav item)

**Step 1: Create global stats page**

Create `app/(dashboard)/stats/page.tsx`:

```tsx
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

export default async function GlobalStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: novels } = await supabase
    .from('novels')
    .select('id')
    .eq('user_id', user!.id)

  const novelIds = (novels || []).map(n => n.id)

  let allChapters: import('@/types').Chapter[] = []
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
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-1">Life Stats</h1>
      <p className="text-xs text-text-muted mb-4 md:mb-6">Across all your novels</p>

      <div className="space-y-3 md:space-y-4">
        <StreakBanner current={streak.current} longest={streak.longest} total={streak.total} />
        <MoodArcChart data={moodData} allData={moodData} />
        <MoodCalendar chapters={allChapters} />
        <WordStats {...wordStats} />
        <GenreOfYourLife />
        <TagCloud tags={tags} />
        <TopSoundtracks soundtracks={soundtracks} />
        <BestQuotes chapters={allChapters} />
      </div>
    </div>
  )
}
```

**Step 2: Add "Stats" to nav items in Sidebar.tsx and MobileNav.tsx**

Both files have this array:
```typescript
const navItems = [
  { href: '/', label: 'Library', icon: '~' },
  { href: '/write', label: 'Write', icon: '>' },
  { href: '/settings', label: 'Settings', icon: '*' },
]
```

Change to:
```typescript
const navItems = [
  { href: '/', label: 'Library', icon: '~' },
  { href: '/write', label: 'Write', icon: '>' },
  { href: '/stats', label: 'Stats', icon: '#' },
  { href: '/settings', label: 'Settings', icon: '*' },
]
```

**Step 3: Commit**

```bash
git add "app/(dashboard)/stats/" components/layout/Sidebar.tsx components/layout/MobileNav.tsx
git commit -m "feat: add global stats page and stats nav item"
```

---

### Task 7: Build verification for Stats Dashboard

**Step 1: Run the build**

```bash
npm run build
```

Fix any TypeScript or ESLint errors that appear. Common issues:
- Recharts types may need `'use client'` directive on chart components
- Import paths must be exact
- Unused variables from Recharts tooltip callbacks

**Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors in stats dashboard"
```

---

## Feature 2: Reading Progress + Search (Tasks 8-11)

### Task 8: Database Migration + Types for Reading Progress

**Files:**
- Create: `supabase/migrations/004_reading_progress.sql`
- Modify: `types/index.ts` (add ReadingProgress type)

**Step 1: Create migration**

Create `supabase/migrations/004_reading_progress.sql`:

```sql
-- ============================================
-- READING PROGRESS TRACKING
-- ============================================
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  last_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  chapters_read INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reading progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id);
```

**Step 2: Add type**

Add to `types/index.ts` before the closing of the file:

```typescript
export interface ReadingProgress {
  id: string
  user_id: string
  novel_id: string
  last_chapter_id: string | null
  chapters_read: number
  updated_at: string
}
```

**Step 3: Commit**

```bash
git add supabase/migrations/004_reading_progress.sql types/index.ts
git commit -m "feat: add reading_progress table migration and type"
```

---

### Task 9: Auto-Track Reading Progress + Novel Card Update

**Files:**
- Modify: `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx` (auto-track on open)
- Modify: `app/(dashboard)/page.tsx` (fetch progress, show on novel cards)
- Modify: `components/novel/NovelCard.tsx` (add continue button + progress bar)

**Step 1: Add auto-tracking to chapter page**

Modify `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx`. After the existing chapter fetch and `notFound()` check, add:

```typescript
// Auto-track reading progress
await supabase
  .from('reading_progress')
  .upsert({
    user_id: (await supabase.auth.getUser()).data.user!.id,
    novel_id: novelId,
    last_chapter_id: chapterId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,novel_id' })
```

**Step 2: Update library home page to fetch progress**

Modify `app/(dashboard)/page.tsx`. After fetching novels, also fetch reading progress:

```typescript
const { data: progress } = await supabase
  .from('reading_progress')
  .select('novel_id, last_chapter_id, chapters_read')
  .eq('user_id', user.id)

// Also fetch total chapter counts per novel
const { data: chapterCounts } = await supabase
  .from('chapters')
  .select('novel_id')
  .in('novel_id', (novels || []).map(n => n.id))
  .is('deleted_at', null)

// Also fetch last chapter titles for the continue button
const progressMap: Record<string, { lastChapterId: string; chaptersRead: number; totalChapters: number }> = {}
if (progress) {
  progress.forEach(p => {
    if (p.last_chapter_id) {
      const total = (chapterCounts || []).filter(c => c.novel_id === p.novel_id).length
      progressMap[p.novel_id] = {
        lastChapterId: p.last_chapter_id,
        chaptersRead: p.chapters_read,
        totalChapters: total,
      }
    }
  })
}
```

Pass `progressMap` to each `NovelCard` as a `progress` prop.

**Step 3: Update NovelCard with Continue button + progress bar**

Add to `NovelCard` props:
```typescript
progress?: { lastChapterId: string; chaptersRead: number; totalChapters: number }
```

Add at the bottom of the card, before the closing `</Card>`:
```tsx
{progress && (
  <div className="mt-2">
    <div className="w-full h-1 bg-ink-surface rounded-full overflow-hidden">
      <div
        className="h-full bg-accent-primary rounded-full transition-all"
        style={{ width: `${Math.min(100, (progress.chaptersRead / Math.max(1, progress.totalChapters)) * 100)}%` }}
      />
    </div>
    <Link
      href={`/novel/${novel.id}/chapter/${progress.lastChapterId}`}
      className="text-xs font-ui text-accent-primary hover:text-accent-primary/80 mt-1 inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      Continue reading
    </Link>
  </div>
)}
```

**Step 4: Commit**

```bash
git add "app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx" "app/(dashboard)/page.tsx" components/novel/NovelCard.tsx
git commit -m "feat: auto-track reading progress and show continue button on novel cards"
```

---

### Task 10: Chapter Search Page

**Files:**
- Create: `app/(dashboard)/novel/[novelId]/search/page.tsx`
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx` (add search link)

**Step 1: Create search page**

Create `app/(dashboard)/novel/[novelId]/search/page.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import type { Chapter } from '@/types'

const MOODS = ['joyful', 'excited', 'peaceful', 'reflective', 'anxious', 'melancholic', 'angry', 'confused']

export default function ChapterSearchPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const [query, setQuery] = useState('')
  const [moodFilter, setMoodFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [results, setResults] = useState<Chapter[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load all tags for this novel
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chapters')
      .select('tags')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .then(({ data }) => {
        const tags = new Set<string>()
        data?.forEach(c => c.tags?.forEach((t: string) => tags.add(t)))
        setAllTags([...tags].sort())
      })
  }, [novelId])

  const search = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .order('chapter_number', { ascending: false })

    if (query.trim()) {
      q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    }
    if (moodFilter) {
      q = q.eq('mood', moodFilter)
    }
    if (tagFilter) {
      q = q.contains('tags', [tagFilter])
    }
    if (dateFrom) {
      q = q.gte('entry_date', dateFrom)
    }
    if (dateTo) {
      q = q.lte('entry_date', dateTo)
    }

    const { data } = await q
    setResults(data || [])
    setLoading(false)
  }, [novelId, query, moodFilter, tagFilter, dateFrom, dateTo])

  useEffect(() => {
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-block">
        &larr; Back to Novel
      </Link>
      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-4">Search Chapters</h1>

      <div className="space-y-3 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapter text or titles..."
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={moodFilter}
            onChange={(e) => setMoodFilter(e.target.value)}
            className="bg-ink-surface border border-ink-border rounded-lg px-3 py-1.5 text-xs font-ui text-text-secondary"
          >
            <option value="">All moods</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto text-xs"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto text-xs"
            placeholder="To"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTagFilter('')}
              className={`px-2 py-0.5 rounded-full text-xs font-ui transition-colors ${
                !tagFilter ? 'bg-ink-highlight text-accent-primary' : 'bg-ink-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`px-2 py-0.5 rounded-full text-xs font-ui transition-colors ${
                  tagFilter === tag ? 'bg-ink-highlight text-accent-primary' : 'bg-ink-surface text-text-muted hover:text-text-secondary'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted text-center py-8">Searching...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No chapters found.</p>
          <p className="text-text-muted text-sm mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-ui mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(chapter => (
            <Link
              key={chapter.id}
              href={`/novel/${novelId}/chapter/${chapter.id}`}
              className="block"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border border-ink-border bg-ink-card hover:border-accent-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-text-primary truncate">
                    {chapter.title || `Chapter ${chapter.chapter_number}`}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(chapter.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {query && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {chapter.content.substring(0, 150)}...
                    </p>
                  )}
                </div>
                {chapter.mood && (
                  <span className="px-2 py-0.5 rounded-full bg-ink-surface text-xs text-text-muted flex-shrink-0">
                    {chapter.mood}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add search link to novel detail page**

Modify `app/(dashboard)/novel/[novelId]/page.tsx`. In the "Chapters" heading row, add a search link:

Find:
```tsx
<h2 className="font-display text-lg md:text-xl text-text-primary">Chapters</h2>
```

Change the surrounding div to:
```tsx
<div className="flex items-center justify-between mb-3 md:mb-4">
  <h2 className="font-display text-lg md:text-xl text-text-primary">Chapters</h2>
  <div className="flex items-center gap-3">
    <Link
      href={`/novel/${novelId}/search`}
      className="text-xs font-ui text-text-muted hover:text-text-secondary transition-colors"
    >
      Search
    </Link>
    {(deletedCount ?? 0) > 0 && (
      <Link
        href={`/novel/${novelId}/bin`}
        className="text-xs font-ui text-text-muted hover:text-text-secondary transition-colors"
      >
        Recycle Bin ({deletedCount})
      </Link>
    )}
  </div>
</div>
```

**Step 3: Commit**

```bash
git add "app/(dashboard)/novel/[novelId]/search/" "app/(dashboard)/novel/[novelId]/page.tsx"
git commit -m "feat: add chapter search page with full-text, mood, tag, and date filters"
```

---

### Task 11: Build Verification for Reading Progress + Search

**Step 1: Run build**

```bash
npm run build
```

Fix any errors. Common issues:
- Missing `line-clamp-2` needs `@tailwindcss/line-clamp` plugin or use `overflow-hidden` with max-height instead
- Supabase `.contains()` for JSONB array filtering
- Reading progress upsert may need auth check adjustment

**Step 2: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve build errors in reading progress and search"
```

---

## Feature 3: Guided Conversation (Tasks 12-15)

### Task 12: Guided Chat Streaming API Endpoint

**Files:**
- Create: `app/api/guided-chat/route.ts`

**Step 1: Create the streaming endpoint**

Create `app/api/guided-chat/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { novelId, messages } = await request.json()

  if (!novelId || !messages) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  // Fetch novel for context
  const { data: novel } = await supabase
    .from('novels')
    .select('title, character_name, genre')
    .eq('id', novelId)
    .single()

  const systemPrompt = `You are a warm, curious, and empathetic interviewer helping someone journal about their day. Your goal is to extract rich, detailed stories from their daily life that can be turned into a novel chapter.

CONTEXT:
- Their novel is called "${novel?.title || 'My Novel'}"
- Protagonist name: "${novel?.character_name || 'the author'}"
- Genre: ${novel?.genre || 'literary fiction'}

RULES:
1. Ask ONE question at a time. Never ask multiple questions in one message.
2. Keep messages short (1-3 sentences max).
3. Be warm and conversational, like a friend catching up.
4. ADAPT based on their response:
   - If SHORT/VAGUE: Ask for specifics — who, what, where, how did it feel?
   - If RICH/DETAILED: Acknowledge what they shared, then ask about a different part of their day.
5. After 4-6 good exchanges, gently ask "Anything else you want to include?" to wrap up.
6. Never use emojis. Keep a literary, warm tone.
7. Start with a simple, open question about their day.`

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2.5',
      messages: apiMessages,
      max_tokens: 256,
      temperature: 0.9,
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return new Response(JSON.stringify({ error: `AI error: ${err}` }), { status: 500 })
  }

  // Forward the SSE stream to the client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

**Step 2: Commit**

```bash
git add app/api/guided-chat/
git commit -m "feat: add streaming guided chat API endpoint"
```

---

### Task 13: Guided Chat Store

**Files:**
- Create: `stores/guided-store.ts`

**Step 1: Create the Zustand store**

Create `stores/guided-store.ts`:

```typescript
import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GuidedStore {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  addUserMessage: (content: string) => void
  addAssistantMessage: (content: string) => void
  setStreaming: (val: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  reset: () => void
}

export const useGuidedStore = create<GuidedStore>((set) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  addUserMessage: (content) => set((state) => ({
    messages: [...state.messages, { role: 'user', content }],
  })),
  addAssistantMessage: (content) => set((state) => ({
    messages: [...state.messages, { role: 'assistant', content }],
    streamingContent: '',
  })),
  setStreaming: (val) => set({ isStreaming: val }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) => set((state) => ({
    streamingContent: state.streamingContent + chunk,
  })),
  reset: () => set({ messages: [], isStreaming: false, streamingContent: '' }),
}))
```

**Step 2: Commit**

```bash
git add stores/guided-store.ts
git commit -m "feat: add guided conversation Zustand store"
```

---

### Task 14: GuidedChat Component + Page

**Files:**
- Create: `components/write/GuidedChat.tsx`
- Create: `app/(dashboard)/write/guided/page.tsx`
- Modify: `app/(dashboard)/write/page.tsx` (add guided mode card)

**Step 1: Create GuidedChat component**

Create `components/write/GuidedChat.tsx`:

```tsx
'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGuidedStore, type ChatMessage } from '@/stores/guided-store'
import { useWriteStore } from '@/stores/write-store'
import { Button } from '@/components/ui/Button'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'

export function GuidedChat() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const {
    messages, isStreaming, streamingContent,
    addUserMessage, addAssistantMessage,
    setStreaming, appendStreamingContent,
    reset: resetChat,
  } = useGuidedStore()

  const { setRawEntry, setSelectedNovelId, setIsGenerating, isGenerating, reset: resetWrite } = useWriteStore()

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Send initial AI greeting on mount
  useEffect(() => {
    if (novelId && messages.length === 0) {
      setSelectedNovelId(novelId)
      sendToAI([])
    }
  }, [novelId])

  async function sendToAI(currentMessages: ChatMessage[]) {
    setStreaming(true)

    try {
      const response = await fetch('/api/guided-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, messages: currentMessages }),
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content || ''
                if (delta) {
                  fullContent += delta
                  appendStreamingContent(delta)
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      }

      addAssistantMessage(fullContent)
    } catch {
      addAssistantMessage("Sorry, I had trouble connecting. Could you try again?")
    }

    setStreaming(false)
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return

    const userMsg = input.trim()
    setInput('')
    addUserMessage(userMsg)

    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }]
    await sendToAI(updatedMessages)
  }

  async function handleGenerate() {
    // Combine all user messages into raw entry
    const rawEntry = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n')

    setRawEntry(rawEntry)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate: new Date().toISOString().split('T')[0],
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const { chapterId } = await response.json()
      resetChat()
      resetWrite()
      router.push(`/novel/${novelId}/chapter/${chapterId}`)
    } catch {
      setIsGenerating(false)
    }
  }

  const userMessageCount = messages.filter(m => m.role === 'user').length

  if (isGenerating) return <GeneratingAnimation />

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-160px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-accent-primary/20 text-text-primary rounded-br-sm'
                : 'bg-ink-surface border border-ink-border text-text-secondary rounded-bl-sm'
            }`}>
              <p className="text-sm font-body leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-bl-sm px-4 py-2.5 bg-ink-surface border border-ink-border">
              <p className="text-sm font-body text-text-secondary leading-relaxed">{streamingContent}</p>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-ink-surface border border-ink-border">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Generate button */}
      {userMessageCount >= 3 && !isStreaming && (
        <div className="py-2 text-center">
          <Button onClick={handleGenerate} size="sm">
            Generate Chapter
          </Button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 pt-2 border-t border-ink-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Tell me about your day..."
          disabled={isStreaming}
          className="flex-1 bg-ink-surface border border-ink-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 disabled:opacity-50"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="sm">
          Send
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Create guided page**

Create `app/(dashboard)/write/guided/page.tsx`:

```tsx
import { GuidedChat } from '@/components/write/GuidedChat'

export default function GuidedWritePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <GuidedChat />
    </div>
  )
}
```

**Step 3: Add guided mode card to write selection page**

Modify `app/(dashboard)/write/page.tsx`. After the existing free-form card, add:

```tsx
<Link href={`/write/guided?novelId=${novelId}`} className="block mt-3">
  <Card hover className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center text-xl">
      ?
    </div>
    <div>
      <h3 className="font-ui font-medium text-text-primary">Guided Chat</h3>
      <p className="text-sm text-text-secondary">AI interviews you about your day</p>
    </div>
  </Card>
</Link>
```

**Step 4: Commit**

```bash
git add components/write/GuidedChat.tsx "app/(dashboard)/write/guided/" "app/(dashboard)/write/page.tsx"
git commit -m "feat: add guided conversation chat UI and page"
```

---

### Task 15: Final Build Verification + Push

**Step 1: Run the build**

```bash
npm run build
```

Fix any TypeScript, ESLint, or build errors.

**Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors in guided conversation"
```

**Step 3: Push all changes**

```bash
git push origin main
```

---

## Summary

| Feature | Tasks | New Files | Modified Files |
|---------|-------|-----------|----------------|
| **Stats Dashboard** | 1-7 | 11 files (lib/stats.ts, 8 widgets, 2 pages, 1 API) | 3 files (nav items, novel detail) |
| **Reading Progress + Search** | 8-11 | 2 files (migration, search page) | 4 files (types, chapter page, home, novel card) |
| **Guided Conversation** | 12-15 | 4 files (API, store, chat component, page) | 1 file (write selection) |

**Total: 15 tasks, ~17 new files, ~8 modified files**

**Dependencies to install:** `recharts`

**Migrations to run:**
1. `supabase/migrations/004_reading_progress.sql` — Reading progress table

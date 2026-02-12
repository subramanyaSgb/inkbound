'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { computeCalendarData } from '@/lib/stats'
import type { Chapter } from '@/types'
import type { DayStats } from '@/lib/stats'

interface MoodCalendarProps {
  chapters: Chapter[]
}

function moodColor(score: number | null): string {
  if (score === null) return 'bg-ink-surface/50'
  if (score < 0.3) return 'bg-mood-negative/60'
  if (score < 0.6) return 'bg-accent-primary/40'
  return 'bg-mood-positive/60'
}

export function MoodCalendar({ chapters }: MoodCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [tooltip, setTooltip] = useState<DayStats | null>(null)

  const days = computeCalendarData(chapters, year, month)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base md:text-lg text-text-primary">Mood Calendar</h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-ink-surface transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-ui text-text-secondary min-w-[120px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-ink-surface transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-text-muted font-ui py-1">{d}</div>
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
            className={`aspect-square rounded-lg ${moodColor(day.score)} transition-all duration-200 hover:ring-1 hover:ring-accent-primary/40 hover:scale-110`}
          />
        ))}
      </div>

      {tooltip && tooltip.title && (
        <div className="mt-3 p-3 rounded-lg glass-card">
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

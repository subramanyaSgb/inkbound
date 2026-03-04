'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DailyEntry } from '@/types'

interface EntryCalendarProps {
  entries: DailyEntry[]
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function EntryCalendar({ entries }: EntryCalendarProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>()
    for (const entry of entries) {
      map.set(entry.entry_date, entry)
    }
    return map
  }, [entries])

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({
        date: d.toISOString().split('T')[0],
        day: d.getDate(),
        isCurrentMonth: false,
      })
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      days.push({
        date: date.toISOString().split('T')[0],
        day: d,
        isCurrentMonth: true,
      })
    }

    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const date = new Date(year, month + 1, d)
        days.push({
          date: date.toISOString().split('T')[0],
          day: d,
          isCurrentMonth: false,
        })
      }
    }

    return days
  }, [currentMonth])

  function prevMonth() {
    setCurrentMonth(prev => {
      const m = prev.month - 1
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m }
    })
  }

  function nextMonth() {
    setCurrentMonth(prev => {
      const m = prev.month + 1
      return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m }
    })
  }

  function handleDayClick(date: string, entry: DailyEntry | undefined) {
    if (entry) {
      router.push(`/write/freeform?novelId=${entry.novel_id}&date=${date}`)
    }
  }

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-ink-surface/50 text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-display text-lg text-text-primary">{monthName}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-ink-surface/50 text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-ui text-text-muted/60 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, day, isCurrentMonth }) => {
          const entry = entryMap.get(date)
          const isToday = date === today
          const hasEntry = !!entry
          const isDraft = entry?.status === 'draft'

          let intensity = 0
          if (entry) {
            if (entry.word_count > 300) intensity = 3
            else if (entry.word_count > 100) intensity = 2
            else intensity = 1
          }

          return (
            <motion.button
              key={date}
              whileHover={hasEntry ? { scale: 1.05 } : undefined}
              onClick={() => handleDayClick(date, entry)}
              disabled={!hasEntry}
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm font-ui transition-all
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${isToday ? 'ring-1 ring-accent-primary/40' : ''}
                ${hasEntry ? 'cursor-pointer hover:bg-ink-surface/60' : 'cursor-default'}
                ${hasEntry && isDraft ? 'bg-accent-primary/[0.06]' : ''}
                ${hasEntry && !isDraft ? 'bg-ink-surface/30' : ''}
              `}
            >
              <span className={`text-xs ${isToday ? 'text-accent-primary font-medium' : isCurrentMonth ? 'text-text-secondary' : 'text-text-muted/40'}`}>
                {day}
              </span>
              {hasEntry && (
                <div className="flex gap-0.5">
                  {Array.from({ length: intensity }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${isDraft ? 'bg-accent-primary' : 'bg-text-muted/40'}`}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[10px] font-ui text-text-muted/60">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
          Draft
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
          Archived
        </div>
        <div className="flex items-center gap-1">
          <span>More dots = more words</span>
        </div>
      </div>
    </div>
  )
}

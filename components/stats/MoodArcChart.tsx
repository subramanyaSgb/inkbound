'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { MoodDataPoint } from '@/lib/stats'

interface MoodArcChartProps {
  data: MoodDataPoint[]
}

const ranges = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 0 },
]

export function MoodArcChart({ data }: MoodArcChartProps) {
  const [activeRange, setActiveRange] = useState('All')

  const filtered = activeRange === 'All'
    ? data
    : (() => {
        const days = ranges.find(r => r.label === activeRange)?.days || 0
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        return data.filter(d => new Date(d.date) >= cutoff)
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
              formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Mood']}
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

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
    <div className="glass-card rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base md:text-lg text-text-primary">Mood Arc</h3>
        <div className="flex gap-0.5 bg-ink-surface/50 rounded-lg p-0.5">
          {ranges.map(r => (
            <button
              key={r.label}
              onClick={() => setActiveRange(r.label)}
              className={`px-2.5 py-1 text-xs font-ui rounded-md transition-all duration-200 ${
                activeRange === r.label
                  ? 'bg-accent-primary/15 text-accent-primary shadow-sm'
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
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis domain={[0, 1]} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(39, 39, 42, 0.5)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
              labelFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              formatter={(value: number | undefined) => [`${((value ?? 0) * 100).toFixed(0)}%`, 'Mood']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#moodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

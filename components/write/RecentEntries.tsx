'use client'

import { motion } from 'framer-motion'
import { Calendar, FileText, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { DailyEntry } from '@/types'

interface RecentEntriesProps {
  entries: DailyEntry[]
  currentEntryDate: string
  selectedIds: Set<string>
  onLoadEntry: (entry: DailyEntry) => void
  onToggleSelect: (id: string) => void
  onGenerateFromSelected: () => void
}

export function RecentEntries({
  entries,
  currentEntryDate,
  selectedIds,
  onLoadEntry,
  onToggleSelect,
  onGenerateFromSelected,
}: RecentEntriesProps) {
  const otherEntries = entries.filter(e => e.entry_date !== currentEntryDate)
  if (otherEntries.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-ui text-text-secondary flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          Recent Draft Entries
        </h3>
        {selectedIds.size > 0 && (
          <Button size="sm" variant="glow" onClick={onGenerateFromSelected}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Generate from {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {otherEntries.map((entry, i) => {
          const isSelected = selectedIds.has(entry.id)
          const date = new Date(entry.entry_date + 'T00:00:00')
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const preview = entry.content.slice(0, 100).trim() + (entry.content.length > 100 ? '...' : '')

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                variant="glass"
                compact
                className={`cursor-pointer transition-all hover:border-accent-primary/30 ${
                  isSelected ? 'border-accent-primary/40 bg-accent-primary/[0.05]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(entry.id) }}
                    className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-accent-primary border-accent-primary'
                        : 'border-ink-border/50 hover:border-accent-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-ink-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Content (clickable to load) */}
                  <div className="flex-1 min-w-0" onClick={() => onLoadEntry(entry)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 text-accent-primary/70" />
                      <span className="text-xs font-ui text-text-secondary">{dateStr}</span>
                      <span className="text-xs text-text-muted">{entry.word_count} words</span>
                    </div>
                    <p className="text-xs text-text-muted/80 font-body line-clamp-2 leading-relaxed">
                      {preview || 'Empty entry'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

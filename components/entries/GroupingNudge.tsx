'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { DailyEntry } from '@/types'

interface GroupingNudgeProps {
  entries: DailyEntry[]
  onSelectEntries: (ids: string[]) => void
  onDismiss: () => void
}

export function GroupingNudge({ entries, onSelectEntries, onDismiss }: GroupingNudgeProps) {
  const consecutiveGroup = useMemo(() => {
    const drafts = entries
      .filter(e => e.status === 'draft')
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date))

    if (drafts.length < 3) return null

    let bestGroup: DailyEntry[] = []
    let currentGroup: DailyEntry[] = [drafts[0]]

    for (let i = 1; i < drafts.length; i++) {
      const prevDate = new Date(drafts[i - 1].entry_date)
      const currDate = new Date(drafts[i].entry_date)
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentGroup.push(drafts[i])
      } else {
        if (currentGroup.length > bestGroup.length) bestGroup = currentGroup
        currentGroup = [drafts[i]]
      }
    }
    if (currentGroup.length > bestGroup.length) bestGroup = currentGroup

    return bestGroup.length >= 3 ? bestGroup : null
  }, [entries])

  if (!consecutiveGroup) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-accent-primary/[0.06] border border-accent-primary/15 mb-4"
    >
      <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0" />
      <p className="text-sm font-ui text-text-secondary flex-1">
        You have <span className="text-accent-primary font-medium">{consecutiveGroup.length} consecutive days</span> of entries — combine into one chapter?
      </p>
      <Button
        size="sm"
        variant="glow"
        onClick={() => onSelectEntries(consecutiveGroup.map(e => e.id))}
      >
        Select All
      </Button>
      <button onClick={onDismiss} className="p-1 text-text-muted/50 hover:text-text-muted transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

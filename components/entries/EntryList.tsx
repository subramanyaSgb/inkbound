'use client'

import { motion } from 'framer-motion'
import { EntryCard } from './EntryCard'
import type { DailyEntry } from '@/types'

interface EntryListProps {
  entries: DailyEntry[]
  novels: { id: string; title: string }[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onEntryDeleted: (id: string) => void
}

export function EntryList({ entries, novels, selectedIds, onToggleSelect, onEntryDeleted }: EntryListProps) {
  const novelMap = new Map(novels.map(n => [n.id, n.title]))

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <EntryCard
            entry={entry}
            novelTitle={novels.length > 1 ? novelMap.get(entry.novel_id) : undefined}
            isSelected={selectedIds.has(entry.id)}
            onToggleSelect={onToggleSelect}
            onDeleted={onEntryDeleted}
          />
        </motion.div>
      ))}
    </div>
  )
}

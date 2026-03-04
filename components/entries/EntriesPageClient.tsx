'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CalendarDays, List, BookOpen, Sparkles } from 'lucide-react'
import { EntryCalendar } from '@/components/entries/EntryCalendar'
import { EntryList } from '@/components/entries/EntryList'
import { WritingStreak } from '@/components/entries/WritingStreak'
import { GroupingNudge } from '@/components/entries/GroupingNudge'
import { Button } from '@/components/ui/Button'
import type { DailyEntry } from '@/types'

type ViewMode = 'calendar' | 'list'
type FilterStatus = 'all' | 'draft' | 'archived'

interface EntriesPageClientProps {
  novels: { id: string; title: string }[]
  initialEntries: DailyEntry[]
  userId: string
}

export function EntriesPageClient({ novels, initialEntries, userId }: EntriesPageClientProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<DailyEntry[]>(initialEntries)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterNovelId, setFilterNovelId] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showNudge, setShowNudge] = useState(true)

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false
      if (filterNovelId && e.novel_id !== filterNovelId) return false
      return true
    })
  }, [entries, filterStatus, filterNovelId])

  const draftEntries = entries.filter(e => e.status === 'draft')

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleEntryDeleted(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleGenerateFromSelected() {
    // Navigate to write page with selected entry IDs
    // For now, use the first selected entry's novel ID
    const firstEntry = entries.find(e => selectedIds.has(e.id))
    if (firstEntry) {
      router.push(`/write/freeform?novelId=${firstEntry.novel_id}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Daily Entries</h1>
          <p className="text-sm text-text-muted font-ui mt-1">
            {draftEntries.length} draft {draftEntries.length === 1 ? 'entry' : 'entries'} ready to generate
          </p>
        </div>
        <WritingStreak userId={userId} />
      </div>

      {/* Smart grouping nudge */}
      {showNudge && (
        <GroupingNudge
          entries={entries}
          onSelectEntries={(ids) => setSelectedIds(new Set(ids))}
          onDismiss={() => setShowNudge(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Status filter */}
        <div className="flex rounded-lg border border-ink-border/30 overflow-hidden">
          {(['all', 'draft', 'archived'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-ui capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-ink-surface/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Novel filter */}
        {novels.length > 1 && (
          <select
            value={filterNovelId}
            onChange={(e) => setFilterNovelId(e.target.value)}
            className="rounded-lg border border-ink-border/30 bg-ink-surface/50 px-3 py-1.5 text-xs font-ui text-text-secondary focus:outline-none focus:border-accent-primary/50"
          >
            <option value="">All novels</option>
            {novels.map(n => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        )}

        {/* View toggle */}
        <div className="flex rounded-lg border border-ink-border/30 overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-1.5 transition-colors ${viewMode === 'calendar' ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <p className="text-text-muted font-ui">No entries yet. Start writing to see your daily entries here.</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <EntryCalendar entries={filteredEntries} />
        ) : (
          <EntryList
            entries={filteredEntries}
            novels={novels}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEntryDeleted={handleEntryDeleted}
          />
        )}
      </motion.div>

      {/* Floating generate button for multi-select */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <Button variant="glow" className="shadow-glow-lg" onClick={handleGenerateFromSelected}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            Generate Chapter from {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'}
          </Button>
        </motion.div>
      )}
    </div>
  )
}

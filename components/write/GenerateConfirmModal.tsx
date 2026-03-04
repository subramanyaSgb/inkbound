'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getEntriesByIds } from '@/lib/daily-entries'
import type { DailyEntry } from '@/types'

interface GenerateConfirmModalProps {
  entryIds: string[]
  currentEntry?: { content: string; entryDate: string }
  novelId: string
  onConfirm: (entryIds: string[]) => void
  onClose: () => void
}

export function GenerateConfirmModal({
  entryIds,
  currentEntry,
  onConfirm,
  onClose,
}: GenerateConfirmModalProps) {
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [archivedWarnings, setArchivedWarnings] = useState<DailyEntry[]>([])

  useEffect(() => {
    async function load() {
      if (entryIds.length === 0 && currentEntry) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const fetched = await getEntriesByIds(supabase, entryIds)
      setEntries(fetched)
      setArchivedWarnings(fetched.filter(e => e.status === 'archived'))
      setLoading(false)
    }
    load()
  }, [entryIds, currentEntry])

  const totalWords = entries.reduce((sum, e) => sum + e.word_count, 0)
    + (currentEntry ? currentEntry.content.trim().split(/\s+/).filter(Boolean).length : 0)

  const totalEntries = entries.length + (currentEntry ? 1 : 0)

  return (
    <Modal isOpen onClose={onClose}>
      <div className="max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-accent-primary" />
          <h2 className="font-display text-lg text-text-primary">Generate Chapter</h2>
        </div>

        {loading ? (
          <p className="text-sm text-text-muted">Loading entries...</p>
        ) : (
          <>
            <p className="text-sm text-text-secondary font-ui mb-4">
              Generate a chapter from <span className="text-accent-primary font-medium">{totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}</span> ({totalWords} words)
            </p>

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {currentEntry && (
                <div className="flex items-center gap-2 text-xs font-ui text-text-muted px-2 py-1.5 rounded bg-ink-surface/50">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(currentEntry.entryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-text-muted/60">(current, unsaved)</span>
                </div>
              )}
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-2 text-xs font-ui text-text-muted px-2 py-1.5 rounded bg-ink-surface/50">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(entry.entry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-text-muted/60">{entry.word_count} words</span>
                  {entry.status === 'archived' && (
                    <span className="text-yellow-500/80 text-[10px]">archived</span>
                  )}
                </div>
              ))}
            </div>

            {archivedWarnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-500/90 font-ui">
                  {archivedWarnings.length === 1
                    ? 'This entry was already used to generate a chapter. Generate anyway?'
                    : `${archivedWarnings.length} entries were already used. Generate anyway?`
                  }
                </p>
              </motion.div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="glow" onClick={() => onConfirm(entryIds)}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Generate
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

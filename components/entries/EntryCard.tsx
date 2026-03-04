'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, BookOpen, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { deleteEntry } from '@/lib/daily-entries'
import type { DailyEntry } from '@/types'

interface EntryCardProps {
  entry: DailyEntry
  novelTitle?: string
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onDeleted: (id: string) => void
}

export function EntryCard({ entry, novelTitle, isSelected, onToggleSelect, onDeleted }: EntryCardProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const date = new Date(entry.entry_date + 'T00:00:00')
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const preview = entry.content.slice(0, 200).trim() + (entry.content.length > 200 ? '...' : '')
  const isDraft = entry.status === 'draft'

  function handleClick() {
    router.push(`/write/freeform?novelId=${entry.novel_id}&date=${entry.entry_date}`)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    const success = await deleteEntry(supabase, entry.id)
    if (success) {
      onDeleted(entry.id)
    }
    setDeleting(false)
    setShowDeleteModal(false)
  }

  return (
    <>
      <Card
        variant="glass"
        className={`transition-all hover:border-accent-primary/20 ${
          isSelected ? 'border-accent-primary/40 bg-accent-primary/[0.05]' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {isDraft && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(entry.id) }}
              className={`mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
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
          )}

          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-accent-primary/70 flex-shrink-0" />
              <span className="text-sm font-ui text-text-primary">{dateStr}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-ui ${
                isDraft
                  ? 'bg-yellow-500/15 text-yellow-500/90'
                  : 'bg-text-muted/10 text-text-muted/60'
              }`}>
                {entry.status}
              </span>
              <span className="text-xs text-text-muted">{entry.word_count} words</span>
            </div>
            {novelTitle && (
              <div className="flex items-center gap-1 mb-1.5">
                <BookOpen className="w-3 h-3 text-text-muted/50" />
                <span className="text-[10px] font-ui text-text-muted/70">{novelTitle}</span>
              </div>
            )}
            <p className="text-xs text-text-muted/80 font-body leading-relaxed line-clamp-2">
              {preview || 'Empty entry'}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!isDraft && entry.chapter_id && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/novel/${entry.novel_id}/chapter/${entry.chapter_id}`) }}
                className="p-1.5 rounded-lg text-text-muted/50 hover:text-accent-primary hover:bg-ink-surface/50 transition-colors"
                title="View Chapter"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true) }}
              className="p-1.5 rounded-lg text-text-muted/50 hover:text-status-error hover:bg-ink-surface/50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Entry">
        <p className="text-sm text-text-secondary font-ui mb-4">
          Delete the entry for {dateStr}? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="secondary" onClick={handleDelete} isLoading={deleting} className="!text-status-error !border-status-error/30">
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}

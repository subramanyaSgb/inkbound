'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ChapterActionsProps {
  chapterId: string
  novelId: string
  chapterTitle: string
}

export function ChapterActions({ chapterId, novelId, chapterTitle }: ChapterActionsProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [quickEditInstruction, setQuickEditInstruction] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isQuickEditing, setIsQuickEditing] = useState(false)

  const [quickEditError, setQuickEditError] = useState('')

  async function handleQuickEdit() {
    if (!quickEditInstruction.trim()) return
    setIsQuickEditing(true)
    setQuickEditError('')

    try {
      // Step 1: Start generation (fast — creates/updates chapter row with 'generating' status)
      const startResponse = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId,
          editInstruction: quickEditInstruction,
        }),
      })

      if (!startResponse.ok) {
        let message = 'Failed to start regeneration'
        try {
          const err = await startResponse.json()
          message = err.error || message
        } catch {
          // Response body wasn't JSON
        }
        throw new Error(message)
      }

      const data = await startResponse.json()

      // Step 2: Fire background AI processing (fire-and-forget)
      fetch('/api/process-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: data.chapterId, editInstruction: quickEditInstruction }),
        keepalive: true,
      }).catch(() => {})

      // Step 3: Redirect to novel page (polling will show generating status)
      setShowEditModal(false)
      setQuickEditInstruction('')
      router.push(`/novel/${novelId}`)
    } catch (err: unknown) {
      setQuickEditError(err instanceof Error ? err.message : 'Something went wrong')
      setIsQuickEditing(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    const supabase = createClient()
    await supabase
      .from('chapters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chapterId)

    setShowDeleteModal(false)
    router.push(`/novel/${novelId}`)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowEditModal(true)}
          className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-ink-surface transition-all"
          title="Edit chapter"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-ink-surface transition-all"
          title="Delete chapter"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Edit Options Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Chapter">
        <div className="space-y-4">
          {/* Quick Edit */}
          <div className="p-4 rounded-xl glass-card">
            <p className="text-sm font-ui text-text-primary mb-2">Quick Edit</p>
            <p className="text-xs text-text-muted mb-3">
              Tell the AI what to change and it will regenerate the chapter.
            </p>
            <Input
              value={quickEditInstruction}
              onChange={e => setQuickEditInstruction(e.target.value)}
              placeholder="e.g. Change my wife's name to Priya, make the ending more hopeful..."
            />
            {quickEditError && <p className="text-xs text-status-error mt-2">{quickEditError}</p>}
            <Button
              size="sm"
              className="mt-3"
              onClick={handleQuickEdit}
              isLoading={isQuickEditing}
              disabled={!quickEditInstruction.trim()}
            >
              Regenerate with Changes
            </Button>
          </div>

          {/* Full Edit */}
          <div className="p-4 rounded-xl glass-card">
            <p className="text-sm font-ui text-text-primary mb-2">Full Edit</p>
            <p className="text-xs text-text-muted mb-3">
              Edit your original entry text and regenerate the entire chapter.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                router.push(`/write/freeform?novelId=${novelId}&chapterId=${chapterId}`)
              }}
            >
              Edit Raw Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Chapter">
        <p className="text-sm text-text-secondary mb-2">
          Move &ldquo;{chapterTitle}&rdquo; to the recycle bin?
        </p>
        <p className="text-xs text-text-muted mb-6">
          You can restore it within 30 days. After that, it will be permanently deleted.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>Move to Bin</Button>
        </div>
      </Modal>
    </>
  )
}

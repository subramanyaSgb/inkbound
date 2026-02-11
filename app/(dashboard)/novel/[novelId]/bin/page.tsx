'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Chapter } from '@/types'

export default function RecycleBinPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const [deletedChapters, setDeletedChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null)
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false)

  const loadDeletedChapters = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    setDeletedChapters(data || [])
    setLoading(false)
  }, [novelId])

  useEffect(() => {
    loadDeletedChapters()
  }, [loadDeletedChapters])

  async function handleRestore(chapterId: string) {
    setRestoringId(chapterId)
    const supabase = createClient()
    await supabase
      .from('chapters')
      .update({ deleted_at: null })
      .eq('id', chapterId)

    setDeletedChapters(prev => prev.filter(c => c.id !== chapterId))
    setRestoringId(null)
  }

  async function handlePermanentDelete() {
    if (!permanentDeleteId) return
    setIsDeletingPermanently(true)
    const supabase = createClient()
    await supabase
      .from('chapters')
      .delete()
      .eq('id', permanentDeleteId)

    setDeletedChapters(prev => prev.filter(c => c.id !== permanentDeleteId))
    setPermanentDeleteId(null)
    setIsDeletingPermanently(false)
  }

  function daysRemaining(deletedAt: string): number {
    const deleted = new Date(deletedAt)
    const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const chapterToDelete = deletedChapters.find(c => c.id === permanentDeleteId)

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/novel/${novelId}`}
        className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-block"
      >
        &larr; Back to Novel
      </Link>

      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-1">Recycle Bin</h1>
      <p className="text-xs text-text-muted mb-4 md:mb-6">
        Deleted chapters are kept for 30 days before being permanently removed.
      </p>

      {loading ? (
        <p className="text-sm text-text-muted py-8 text-center">Loading...</p>
      ) : deletedChapters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">Recycle bin is empty.</p>
          <p className="text-text-muted text-sm mt-1">Deleted chapters will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deletedChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="flex items-start gap-3 p-3 md:p-4 rounded-lg border border-ink-border bg-ink-card"
            >
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center">
                <span className="text-xs md:text-sm font-ui text-text-muted">{chapter.chapter_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-text-primary truncate">
                  {chapter.title || `Chapter ${chapter.chapter_number}`}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Deleted {new Date(chapter.deleted_at!).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' '}&middot; {daysRemaining(chapter.deleted_at!)} days remaining
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleRestore(chapter.id)}
                  disabled={restoringId === chapter.id}
                  className="text-xs font-ui text-accent-primary hover:text-accent-primary/80 transition-colors disabled:opacity-50"
                >
                  {restoringId === chapter.id ? 'Restoring...' : 'Restore'}
                </button>
                <button
                  onClick={() => setPermanentDeleteId(chapter.id)}
                  className="text-xs font-ui text-text-muted hover:text-status-error transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!permanentDeleteId}
        onClose={() => setPermanentDeleteId(null)}
        title="Delete Forever"
      >
        <p className="text-sm text-text-secondary mb-2">
          Permanently delete &ldquo;{chapterToDelete?.title || `Chapter ${chapterToDelete?.chapter_number}`}&rdquo;?
        </p>
        <p className="text-xs text-text-muted mb-6">
          This action cannot be undone. The chapter will be permanently removed.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setPermanentDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handlePermanentDelete} isLoading={isDeletingPermanently}>
            Delete Forever
          </Button>
        </div>
      </Modal>
    </div>
  )
}

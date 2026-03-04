'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import { useWriteStore } from '@/stores/write-store'
import { useEntryStore } from '@/stores/entry-store'
import { useAutoSave } from '@/hooks/useAutoSave'
import { FreeformEditor } from '@/components/write/FreeformEditor'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { SaveStatus } from '@/components/write/SaveStatus'
import { RecentEntries } from '@/components/write/RecentEntries'
import { GenerateConfirmModal } from '@/components/write/GenerateConfirmModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { getEntryByDate, getRecentDraftEntries } from '@/lib/daily-entries'
import { scanForUnknownReferences, type UnknownReference } from '@/lib/profile-scanner'
import { ProfileQuestionModal, type ProfileAnswer } from '@/components/write/ProfileQuestionModal'
import { Toast } from '@/components/ui/Toast'
import type { StoryProfile, DailyEntry } from '@/types'

export default function FreeformWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const chapterId = searchParams.get('chapterId')
  const router = useRouter()

  // Write store (for generation state + editing existing chapters)
  const { entryDate, setEntryDate, setSelectedNovelId, setRawEntry, isGenerating, setIsGenerating, setEditingChapterId, reset, initDate } = useWriteStore()

  // Entry store (for daily entry persistence)
  const { currentEntry, updateContent, setCurrentEntry, savedEntryId, clear: clearEntry } = useEntryStore()
  const { saveNow } = useAutoSave(novelId, 'freeform')

  const [error, setError] = useState('')
  const [isLoadingEntry, setIsLoadingEntry] = useState(false)
  const [unknowns, setUnknowns] = useState<UnknownReference[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([])
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())

  const isEditing = !!chapterId
  const rawEntry = currentEntry?.content || ''

  // Set novel ID
  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  // Initialize date
  useEffect(() => {
    if (!chapterId) initDate()
  }, [chapterId, initDate])

  // Load existing entry for today (or selected date) from DB
  useEffect(() => {
    if (!novelId || isEditing || !entryDate) return

    async function loadEntry() {
      setIsLoadingEntry(true)
      const supabase = createClient()

      // Check localStorage first
      const local = useEntryStore.getState().loadFromLocalStorage(novelId!, entryDate)

      // Then check DB
      const dbEntry = await getEntryByDate(supabase, novelId!, entryDate)

      if (local && local.isDirty && (!dbEntry || new Date(local.lastSavedAt || 0) > new Date(dbEntry.updated_at))) {
        // localStorage has newer unsaved content
        setCurrentEntry(local)
        if (dbEntry) useEntryStore.setState({ savedEntryId: dbEntry.id })
      } else if (dbEntry && dbEntry.status === 'draft') {
        // DB has the latest
        setCurrentEntry({
          novelId: novelId!,
          entryDate,
          content: dbEntry.content,
          entryMode: 'freeform',
          lastSavedAt: dbEntry.updated_at,
          isDirty: false,
        })
        useEntryStore.setState({ savedEntryId: dbEntry.id })
      } else {
        // Fresh entry
        setCurrentEntry({
          novelId: novelId!,
          entryDate,
          content: '',
          entryMode: 'freeform',
          lastSavedAt: null,
          isDirty: false,
        })
      }

      setIsLoadingEntry(false)
    }

    loadEntry()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId, entryDate, isEditing])

  // Load existing chapter entry when editing
  useEffect(() => {
    if (!chapterId) return
    setIsLoadingEntry(true)
    setEditingChapterId(chapterId)

    const supabase = createClient()
    supabase
      .from('chapters')
      .select('raw_entry, entry_date')
      .eq('id', chapterId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRawEntry(data.raw_entry)
          setEntryDate(data.entry_date)
          setCurrentEntry({
            novelId: novelId || '',
            entryDate: data.entry_date,
            content: data.raw_entry,
            entryMode: 'freeform',
            lastSavedAt: null,
            isDirty: false,
          })
        }
        setIsLoadingEntry(false)
      })
  }, [chapterId, novelId, setEditingChapterId, setRawEntry, setEntryDate, setCurrentEntry])

  // Load recent draft entries
  useEffect(() => {
    if (!novelId || isEditing) return

    async function loadRecent() {
      const supabase = createClient()
      const entries = await getRecentDraftEntries(supabase, novelId!)
      setRecentEntries(entries)
    }

    loadRecent()
  }, [novelId, isEditing])

  // Sync rawEntry to write store for profile scanning/validation
  useEffect(() => {
    setRawEntry(rawEntry)
  }, [rawEntry, setRawEntry])

  // Handle content change from editor
  const handleContentChange = useCallback((text: string) => {
    updateContent(text)
  }, [updateContent])

  // Handle date change — save current first, then switch
  async function handleDateChange(newDate: string) {
    const entry = useEntryStore.getState().currentEntry
    if (entry?.isDirty) {
      await saveNow()
    }
    setEntryDate(newDate)
  }

  // Manual save
  async function handleSave() {
    await saveNow()
    setToastMessage('Entry saved')
    setShowToast(true)
  }

  // Open generate confirmation
  function handleGenerateClick() {
    if (!rawEntry.trim()) return

    const currentId = savedEntryId
    if (currentId) {
      setSelectedEntryIds(new Set([currentId]))
    }
    setShowGenerateModal(true)
  }

  // Actual generation (called after confirmation)
  async function handleConfirmGenerate(entryIds: string[]) {
    setShowGenerateModal(false)
    if (!novelId) return

    // Save current entry first if dirty
    const entry = useEntryStore.getState().currentEntry
    if (entry?.isDirty) {
      await saveNow()
    }

    // Profile scanning
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profiles } = await supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)

    const found = scanForUnknownReferences(rawEntry, (profiles as StoryProfile[]) || [])

    if (found.length > 0) {
      setUnknowns(found)
      setShowProfileModal(true)
      setSelectedEntryIds(new Set(entryIds))
    } else {
      await doGenerate(entryIds)
    }
  }

  async function doGenerate(entryIds: string[]) {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      const startResponse = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate,
          entryIds,
          ...(isEditing && { chapterId }),
        }),
      })

      if (!startResponse.ok) {
        let message = 'Failed to start chapter generation'
        try {
          const err = await startResponse.json()
          message = err.error || message
        } catch { /* not JSON */ }
        throw new Error(message)
      }

      const { chapterId: generatingChapterId } = await startResponse.json()

      // Fire background AI generation
      fetch('/api/process-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: generatingChapterId }),
        keepalive: true,
      }).catch(() => {})

      // Poll for completion
      const POLL_INTERVAL = 5000
      const MAX_WAIT = 30000
      const startTime = Date.now()

      const pollForCompletion = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const interval = setInterval(async () => {
            if (Date.now() - startTime >= MAX_WAIT) {
              clearInterval(interval)
              resolve(null)
              return
            }
            try {
              const statusRes = await fetch(`/api/chapter-status?id=${generatingChapterId}`)
              if (statusRes.ok) {
                const data = await statusRes.json()
                if (data.status === 'completed') { clearInterval(interval); resolve('completed') }
                else if (data.status === 'failed') { clearInterval(interval); resolve('failed') }
              }
            } catch { /* keep polling */ }
          }, POLL_INTERVAL)
        })
      }

      const result = await pollForCompletion()

      if (result === 'completed') {
        reset()
        clearEntry()
        router.push(`/novel/${novelId}/chapter/${generatingChapterId}`)
      } else if (result === 'failed') {
        setError('Chapter generation failed. You can retry from the novel page.')
        setIsGenerating(false)
      } else {
        reset()
        clearEntry()
        setToastMessage('Your chapter is being crafted in the background. Check back shortly!')
        setShowToast(true)
        setTimeout(() => router.push(`/novel/${novelId}`), 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }

  async function handleProfileAnswers(answers: ProfileAnswer[]) {
    setShowProfileModal(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const toSave = answers.filter(a => !a.skipped && a.name.trim())
    if (toSave.length > 0) {
      await supabase.from('story_profiles').insert(
        toSave.map(a => ({
          user_id: user.id,
          type: a.type,
          name: a.name,
          relationship: a.relationship !== 'unknown' ? a.relationship : null,
          nickname: a.nickname || null,
          details: a.details,
        }))
      )
    }

    await doGenerate(Array.from(selectedEntryIds))
  }

  // Load a recent entry into the editor
  function handleLoadEntry(entry: DailyEntry) {
    setEntryDate(entry.entry_date)
  }

  // Toggle entry selection for multi-day generation
  function handleToggleEntrySelect(entryId: string) {
    setSelectedEntryIds(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  // Unsaved changes warning
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      const entry = useEntryStore.getState().currentEntry
      if (entry?.isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  if (isLoadingEntry) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[200px]">
        <p className="text-text-muted font-ui text-sm">Loading entry...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button onClick={() => { reset(); clearEntry(); router.back() }} className="text-sm text-text-muted hover:text-accent-primary/70 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <SaveStatus />
          <Input
            type="date"
            value={entryDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-auto text-sm"
          />
        </div>
      </div>

      {isEditing && (
        <p className="text-xs text-accent-primary font-ui mb-3">Editing entry — changes will regenerate this chapter</p>
      )}

      {/* Editor */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="min-h-[250px] md:min-h-[400px]">
          <FreeformEditor onContentChange={handleContentChange} />
        </Card>
      </motion.div>

      {error && <p className="text-sm text-status-error mt-4">{error}</p>}

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end mt-4 md:mt-6 gap-2 md:gap-3">
        <Button variant="secondary" onClick={() => { reset(); clearEntry(); router.back() }}>
          Discard
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={!rawEntry.trim() || !currentEntry?.isDirty}>
          <Save className="w-4 h-4 mr-1.5" />
          Save Entry
        </Button>
        <Button onClick={handleGenerateClick} isLoading={isGenerating} disabled={!rawEntry.trim()} variant="glow">
          {isGenerating
            ? (isEditing ? 'Regenerating...' : 'Generating Chapter...')
            : (isEditing ? 'Regenerate Chapter' : 'Generate Chapter')
          }
        </Button>
      </div>

      {/* Recent entries */}
      {!isEditing && recentEntries.length > 0 && (
        <RecentEntries
          entries={recentEntries}
          currentEntryDate={entryDate}
          selectedIds={selectedEntryIds}
          onLoadEntry={handleLoadEntry}
          onToggleSelect={handleToggleEntrySelect}
          onGenerateFromSelected={() => {
            if (selectedEntryIds.size > 0) {
              setShowGenerateModal(true)
            }
          }}
        />
      )}

      {/* Modals & overlays */}
      {isGenerating && <GeneratingAnimation />}

      {showGenerateModal && (
        <GenerateConfirmModal
          entryIds={Array.from(selectedEntryIds)}
          currentEntry={savedEntryId ? undefined : { content: rawEntry, entryDate }}
          novelId={novelId || ''}
          onConfirm={handleConfirmGenerate}
          onClose={() => setShowGenerateModal(false)}
        />
      )}

      {showProfileModal && (
        <ProfileQuestionModal
          unknowns={unknowns}
          onComplete={handleProfileAnswers}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      <Toast
        message={toastMessage}
        type="info"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  )
}

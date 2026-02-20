'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useWriteStore } from '@/stores/write-store'
import { FreeformEditor } from '@/components/write/FreeformEditor'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { scanForUnknownReferences, type UnknownReference } from '@/lib/profile-scanner'
import { ProfileQuestionModal, type ProfileAnswer } from '@/components/write/ProfileQuestionModal'
import { Toast } from '@/components/ui/Toast'
import { entrySchema } from '@/lib/validations'
import type { StoryProfile } from '@/types'

export default function FreeformWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const chapterId = searchParams.get('chapterId')
  const router = useRouter()
  const { rawEntry, entryDate, setEntryDate, setSelectedNovelId, setRawEntry, isGenerating, setIsGenerating, setEditingChapterId, reset, initDate } = useWriteStore()
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoadingEntry, setIsLoadingEntry] = useState(false)
  const [unknowns, setUnknowns] = useState<UnknownReference[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const isEditing = !!chapterId

  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  // Initialize date on the client to avoid hydration mismatch
  useEffect(() => {
    if (!chapterId) initDate()
  }, [chapterId, initDate])

  // Load existing entry when editing
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
        }
        setIsLoadingEntry(false)
      })
  }, [chapterId, setEditingChapterId, setRawEntry, setEntryDate])

  async function doGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      // Step 1: Create chapter row with 'generating' status (fast)
      const startResponse = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate,
          ...(isEditing && { chapterId }),
        }),
      })

      if (!startResponse.ok) {
        let message = 'Failed to start chapter generation'
        try {
          const err = await startResponse.json()
          message = err.error || message
        } catch {
          // Response wasn't JSON
        }
        throw new Error(message)
      }

      const { chapterId: generatingChapterId } = await startResponse.json()

      // Step 2: Fire background AI generation (fire-and-forget)
      fetch('/api/process-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: generatingChapterId,
        }),
        keepalive: true,
      }).catch(() => {
        // Fire-and-forget: errors handled by status polling
      })

      // Step 3: Poll for completion (every 5s, up to 30s)
      const POLL_INTERVAL = 5000
      const MAX_WAIT = 30000
      const startTime = Date.now()

      const pollForCompletion = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const interval = setInterval(async () => {
            const elapsed = Date.now() - startTime
            if (elapsed >= MAX_WAIT) {
              clearInterval(interval)
              resolve(null) // Timed out
              return
            }

            try {
              const statusRes = await fetch(`/api/chapter-status?id=${generatingChapterId}`)
              if (statusRes.ok) {
                const data = await statusRes.json()
                if (data.status === 'completed') {
                  clearInterval(interval)
                  resolve('completed')
                } else if (data.status === 'failed') {
                  clearInterval(interval)
                  resolve('failed')
                }
              }
            } catch {
              // Polling error, keep trying
            }
          }, POLL_INTERVAL)
        })
      }

      const result = await pollForCompletion()

      if (result === 'completed') {
        // AI finished in time — redirect to reader
        reset()
        router.push(`/novel/${novelId}/chapter/${generatingChapterId}`)
      } else if (result === 'failed') {
        // AI failed — show error
        setError('Chapter generation failed. You can retry from the novel page.')
        setIsGenerating(false)
      } else {
        // Timed out (30s) — redirect to novel page with toast
        reset()
        setToastMessage('Your chapter is being crafted in the background. Check back shortly!')
        setShowToast(true)
        setTimeout(() => {
          router.push(`/novel/${novelId}`)
        }, 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }

  async function handleGenerate() {
    if (!novelId) return
    setError('')

    const result = entrySchema.safeParse({ rawEntry, entryDate, novelId })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setValidationErrors(fieldErrors)
      return
    }
    setValidationErrors({})

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
    } else {
      await doGenerate()
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

    await doGenerate()
  }

  if (isLoadingEntry) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[200px]">
        <p className="text-text-muted font-ui text-sm">Loading entry...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button onClick={() => { reset(); router.back() }} className="text-sm text-text-muted hover:text-text-secondary flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-auto text-sm"
        />
      </div>

      {isEditing && (
        <p className="text-xs text-accent-primary font-ui mb-3">Editing entry — changes will regenerate this chapter</p>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="min-h-[250px] md:min-h-[400px]">
          <FreeformEditor />
        </Card>
      </motion.div>

      {error && <p className="text-sm text-status-error mt-4">{error}</p>}
      {validationErrors.rawEntry && <p className="text-xs text-status-error mt-2">{validationErrors.rawEntry}</p>}
      {validationErrors.entryDate && <p className="text-xs text-status-error mt-1">{validationErrors.entryDate}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-end mt-4 md:mt-6 gap-2 md:gap-3">
        <Button variant="secondary" onClick={() => { reset(); router.back() }}>
          Discard
        </Button>
        <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!rawEntry.trim()} variant="glow">
          {isGenerating
            ? (isEditing ? 'Regenerating...' : 'Generating Chapter...')
            : (isEditing ? 'Regenerate Chapter' : 'Generate Chapter')
          }
        </Button>
      </div>

      {isGenerating && <GeneratingAnimation />}

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
        duration={5000}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useWriteStore } from '@/stores/write-store'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { scanForUnknownReferences, type UnknownReference } from '@/lib/profile-scanner'
import { ProfileQuestionModal, type ProfileAnswer } from '@/components/write/ProfileQuestionModal'
import type { StoryProfile } from '@/types'

const PROMPTS = [
  { id: 'highlight', label: 'Highlight', question: 'What was the best part of your day?' },
  { id: 'people', label: 'People', question: 'Who did you spend time with today?' },
  { id: 'feeling', label: 'Feeling', question: 'How are you feeling right now?' },
  { id: 'surprise', label: 'Surprise', question: 'Did anything unexpected happen?' },
  { id: 'challenge', label: 'Challenge', question: 'What was difficult or frustrating today?' },
  { id: 'gratitude', label: 'Gratitude', question: 'What are you grateful for today?' },
  { id: 'detail', label: 'Detail', question: 'Describe one moment in vivid detail — sights, sounds, feelings.' },
  { id: 'thought', label: 'On your mind', question: "What's been on your mind lately?" },
]

export default function StructuredWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const router = useRouter()
  const { entryDate, setEntryDate, setSelectedNovelId, setRawEntry, isGenerating, setIsGenerating, reset, initDate } = useWriteStore()
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['highlight', 'people', 'feeling']))
  const [unknowns, setUnknowns] = useState<UnknownReference[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  useEffect(() => {
    initDate()
  }, [initDate])

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function buildRawEntry(): string {
    return PROMPTS
      .filter(p => answers[p.id]?.trim())
      .map(p => answers[p.id].trim())
      .join('\n\n')
  }

  const filledCount = PROMPTS.filter(p => answers[p.id]?.trim()).length
  const rawEntry = buildRawEntry()

  async function doGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, rawEntry, entryDate }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        let message = 'Failed to generate chapter'
        try {
          const err = await response.json()
          message = err.error || message
        } catch {
          // Response body wasn't JSON
        }
        throw new Error(message)
      }

      const { chapterId } = await response.json()
      reset()
      router.push(`/novel/${novelId}/chapter/${chapterId}`)
    } catch (err: unknown) {
      clearTimeout(timeout)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Generation is taking too long. Please check your novel — your chapter may still be processing.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
      setIsGenerating(false)
    }
  }

  async function handleGenerate() {
    if (!novelId || !rawEntry.trim()) return
    setError('')
    setRawEntry(rawEntry)

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

  async function handleProfileAnswers(profileAnswers: ProfileAnswer[]) {
    setShowProfileModal(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const toSave = profileAnswers.filter(a => !a.skipped && a.name.trim())
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-text-muted font-ui mb-4">Answer a few prompts — skip any that don&apos;t apply. The AI weaves your answers into a chapter.</p>

        <div className="space-y-2">
          {PROMPTS.map((prompt, i) => {
            const isOpen = expanded.has(prompt.id)
            const hasAnswer = !!answers[prompt.id]?.trim()

            return (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card variant="glass" compact>
                  <button
                    type="button"
                    onClick={() => toggleExpand(prompt.id)}
                    className="w-full flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAnswer ? 'bg-accent-primary' : 'bg-ink-border'}`} />
                      <span className="font-ui text-sm text-text-primary truncate">{prompt.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="mt-3"
                    >
                      <textarea
                        value={answers[prompt.id] || ''}
                        onChange={(e) => setAnswer(prompt.id, e.target.value)}
                        placeholder="Write as much or as little as you want..."
                        className="w-full min-h-[80px] bg-transparent font-body text-sm md:text-base text-text-primary leading-relaxed placeholder:text-text-muted/40 resize-none focus:outline-none"
                        autoFocus={i === 0}
                      />
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {error && <p className="text-sm text-status-error mt-4">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-4 md:mt-6 gap-2 md:gap-3">
        <p className="text-xs text-text-muted font-ui">{filledCount} of {PROMPTS.length} answered</p>
        <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => { reset(); router.back() }} className="flex-1 sm:flex-none">
            Discard
          </Button>
          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={filledCount === 0} variant="glow" className="flex-1 sm:flex-none">
            {isGenerating ? 'Generating Chapter...' : 'Generate Chapter'}
          </Button>
        </div>
      </div>

      {isGenerating && <GeneratingAnimation />}

      {showProfileModal && (
        <ProfileQuestionModal
          unknowns={unknowns}
          onComplete={handleProfileAnswers}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  )
}

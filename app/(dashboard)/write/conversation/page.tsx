'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, SkipForward } from 'lucide-react'
import { useWriteStore } from '@/stores/write-store'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { scanForUnknownReferences, type UnknownReference } from '@/lib/profile-scanner'
import { ProfileQuestionModal, type ProfileAnswer } from '@/components/write/ProfileQuestionModal'
import type { StoryProfile } from '@/types'

const QUESTIONS = [
  'How did your day start? What time did you wake up and how were you feeling?',
  'What was the most notable thing that happened today?',
  'Did you have any interesting conversations? What was said?',
  'What were you thinking about the most today?',
  'How are you feeling right now as the day ends?',
  'Anything else you want to capture about today?',
]

interface Message {
  role: 'ai' | 'user'
  text: string
}

export default function ConversationWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const router = useRouter()
  const { entryDate, setEntryDate, setSelectedNovelId, isGenerating, setIsGenerating, reset, initDate } = useWriteStore()
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [unknowns, setUnknowns] = useState<UnknownReference[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  useEffect(() => {
    initDate()
  }, [initDate])

  // Show first question on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'ai', text: QUESTIONS[0] }])
    }
  }, [messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Focus input after new question
  useEffect(() => {
    inputRef.current?.focus()
  }, [currentQuestion])

  function buildRawEntry(): string {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('\n\n')
  }

  function handleSend() {
    const text = inputValue.trim()
    if (!text) return

    const newMessages: Message[] = [...messages, { role: 'user', text }]
    setMessages(newMessages)
    setInputValue('')

    const nextQ = currentQuestion + 1
    if (nextQ < QUESTIONS.length) {
      setCurrentQuestion(nextQ)
      // Add next AI question after a brief delay
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: QUESTIONS[nextQ] }])
      }, 400)
    } else {
      setIsComplete(true)
    }
  }

  function handleSkip() {
    const nextQ = currentQuestion + 1
    if (nextQ < QUESTIONS.length) {
      setCurrentQuestion(nextQ)
      setMessages(prev => [...prev, { role: 'ai', text: QUESTIONS[nextQ] }])
    } else {
      setIsComplete(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function doGenerate() {
    const rawEntry = buildRawEntry()
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
    const rawEntry = buildRawEntry()
    if (!novelId || !rawEntry.trim()) return
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

  const hasAnswers = messages.some(m => m.role === 'user')

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-ink-glass/60 border border-ink-border/30 text-text-secondary font-ui'
                    : 'bg-accent-primary/15 border border-accent-primary/20 text-text-primary font-body'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-ink-glass/60 border border-accent-primary/30 text-accent-primary font-ui">
              All done! Ready to generate your chapter.
            </div>
          </motion.div>
        )}
      </div>

      {error && <p className="text-sm text-status-error mb-2 flex-shrink-0">{error}</p>}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-ink-border/30 pt-3">
        {!isComplete ? (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              rows={2}
              className="flex-1 rounded-xl border border-ink-border/50 bg-ink-surface/80 px-4 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-primary/50 focus:shadow-glow-sm transition-all resize-none"
            />
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="glow" onClick={handleSend} disabled={!inputValue.trim()} className="px-3">
                <Send className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSkip} className="px-3" title="Skip this question">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { reset(); router.back() }} className="flex-1">
              Discard
            </Button>
            <Button variant="glow" onClick={handleGenerate} isLoading={isGenerating} disabled={!hasAnswers} className="flex-1">
              {isGenerating ? 'Generating Chapter...' : 'Generate Chapter'}
            </Button>
          </div>
        )}

        {!isComplete && hasAnswers && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            isLoading={isGenerating}
            className="w-full mt-2"
          >
            End early & Generate Chapter
          </Button>
        )}
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

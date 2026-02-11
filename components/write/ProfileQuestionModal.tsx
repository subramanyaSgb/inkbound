'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { UnknownReference } from '@/lib/profile-scanner'

export interface ProfileAnswer {
  keyword: string
  relationship: string
  type: 'character' | 'location'
  name: string
  nickname: string
  details: Record<string, string>
  skipped: boolean
}

interface ProfileQuestionModalProps {
  unknowns: UnknownReference[]
  onComplete: (results: ProfileAnswer[]) => void
  onClose: () => void
}

export function ProfileQuestionModal({ unknowns, onComplete, onClose }: ProfileQuestionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<ProfileAnswer[]>([])
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [details, setDetails] = useState<Record<string, string>>({})

  const current = unknowns[currentIndex]
  if (!current) return null

  const isCharacter = current.type === 'character'

  function handleNext(skipped: boolean) {
    const answer: ProfileAnswer = {
      keyword: current.keyword,
      relationship: current.relationship,
      type: current.type,
      name: skipped ? '' : name,
      nickname: skipped ? '' : nickname,
      details: skipped ? {} : details,
      skipped,
    }

    const newAnswers = [...answers, answer]

    if (currentIndex + 1 >= unknowns.length) {
      onComplete(newAnswers)
    } else {
      setAnswers(newAnswers)
      setCurrentIndex(prev => prev + 1)
      setName('')
      setNickname('')
      setDetails({})
      setShowMore(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`You mentioned "${current.keyword}"`}
    >
      <p className="text-sm text-text-secondary mb-4">
        Help us get the details right. Fill in what you want — the AI will only use what you provide.
      </p>

      <div className="space-y-3">
        <Input
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isCharacter ? "What's their name?" : "What's this place called?"}
          autoFocus
        />

        {current.relationship !== 'unknown' && (
          <p className="text-xs text-text-muted">
            Relationship: <span className="text-text-secondary">{current.relationship}</span>
          </p>
        )}

        {isCharacter && (
          <Input
            label="Nickname (optional)"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="How you refer to them"
          />
        )}

        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="text-xs text-accent-primary hover:text-accent-primary/80 font-ui"
          >
            + Add more details
          </button>
        )}

        {showMore && (
          <div className="space-y-2 pt-1">
            {isCharacter ? (
              <>
                <Input label="Age" value={details.age || ''} onChange={e => setDetails(d => ({ ...d, age: e.target.value }))} placeholder="e.g. 28" />
                <Input label="Personality" value={details.personality || ''} onChange={e => setDetails(d => ({ ...d, personality: e.target.value }))} placeholder="e.g. cheerful, quiet, funny" />
                <Input label="Appearance" value={details.appearance || ''} onChange={e => setDetails(d => ({ ...d, appearance: e.target.value }))} placeholder="Brief description" />
                <Input label="Occupation" value={details.occupation || ''} onChange={e => setDetails(d => ({ ...d, occupation: e.target.value }))} placeholder="What do they do?" />
              </>
            ) : (
              <>
                <Input label="Type" value={details.type || ''} onChange={e => setDetails(d => ({ ...d, type: e.target.value }))} placeholder="e.g. apartment, cafe, park" />
                <Input label="Description" value={details.description || ''} onChange={e => setDetails(d => ({ ...d, description: e.target.value }))} placeholder="What's it like?" />
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <span className="text-xs text-text-muted">{currentIndex + 1} of {unknowns.length}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleNext(true)}>
            Skip
          </Button>
          <Button size="sm" onClick={() => handleNext(false)} disabled={!name.trim()}>
            {currentIndex + 1 >= unknowns.length ? 'Save & Generate' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

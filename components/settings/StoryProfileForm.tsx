'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import type { StoryProfile, StoryProfileType } from '@/types'

interface StoryProfileFormProps {
  type: StoryProfileType
  profile?: StoryProfile | null
  onSave: (data: { name: string; relationship: string; nickname: string; details: Record<string, string> }) => Promise<void>
  onCancel: () => void
}

const detailFields: Record<StoryProfileType, string[]> = {
  personal: ['age', 'job', 'personality', 'appearance', 'habits'],
  character: ['age', 'personality', 'appearance', 'occupation', 'quirks'],
  location: ['type', 'description', 'significance'],
}

export function StoryProfileForm({ type, profile, onSave, onCancel }: StoryProfileFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [relationship, setRelationship] = useState(profile?.relationship || '')
  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [details, setDetails] = useState<Record<string, string>>(profile?.details || {})
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    await onSave({ name, relationship, nickname, details })
    setIsSaving(false)
  }

  function setDetail(key: string, value: string) {
    setDetails(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Card variant="glass" compact>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
        {type === 'character' && (
          <Input label="Relationship" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="e.g. wife, friend, brother" />
        )}
        {type !== 'location' && (
          <Input label="Nickname (optional)" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="How you refer to them" />
        )}

        <div className="pt-2">
          <p className="text-xs font-ui text-text-muted mb-2">Details (all optional)</p>
          <div className="space-y-2">
            {detailFields[type].map(field => (
              <Input
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={details[field] || ''}
                onChange={e => setDetail(field, e.target.value)}
                placeholder={`Enter ${field}...`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={isSaving} size="sm">Save</Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}

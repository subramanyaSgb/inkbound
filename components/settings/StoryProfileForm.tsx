'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { storyProfileSchema } from '@/lib/validations'
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = storyProfileSchema.safeParse({
      name,
      relationship: relationship || undefined,
      nickname: nickname || undefined,
      details: Object.keys(details).length > 0 ? details : undefined,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

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
        <div>
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
          {errors.name && <p className="text-xs text-status-error mt-1">{errors.name}</p>}
        </div>
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

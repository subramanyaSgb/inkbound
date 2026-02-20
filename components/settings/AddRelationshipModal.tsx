'use client'

import { useState, useEffect } from 'react'
import { Link2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RELATIONSHIP_TYPES } from '@/lib/constants'
import { addRelationship, updateRelationship } from '@/lib/relationships'
import { createClient } from '@/lib/supabase/client'
import type { StoryProfile, ProfileRelationship } from '@/types'

interface AddRelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  profiles: StoryProfile[]
  userId: string
  preselectedFromId?: string
  editingRelationship?: ProfileRelationship | null
}

export function AddRelationshipModal({
  isOpen,
  onClose,
  onSave,
  profiles,
  userId,
  preselectedFromId,
  editingRelationship,
}: AddRelationshipModalProps) {
  const [fromProfileId, setFromProfileId] = useState('')
  const [toProfileId, setToProfileId] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens or editing relationship changes
  useEffect(() => {
    if (isOpen) {
      if (editingRelationship) {
        setFromProfileId(editingRelationship.from_profile_id)
        setToProfileId(editingRelationship.to_profile_id)
        setRelationshipType(editingRelationship.relationship_type)
        setCustomLabel(editingRelationship.label || '')
      } else {
        setFromProfileId(preselectedFromId || '')
        setToProfileId('')
        setRelationshipType('')
        setCustomLabel('')
      }
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, editingRelationship, preselectedFromId])

  const isEditing = !!editingRelationship

  // Filter "To" profiles to exclude the selected "From" person
  const availableToProfiles = profiles.filter((p) => p.id !== fromProfileId)

  function validate(): boolean {
    const errors: Record<string, string> = {}

    if (!fromProfileId) {
      errors.from = 'Please select a person'
    }
    if (!toProfileId) {
      errors.to = 'Please select a person'
    }
    if (fromProfileId && toProfileId && fromProfileId === toProfileId) {
      errors.to = 'Cannot create a relationship with the same person'
    }
    if (!relationshipType) {
      errors.type = 'Please select a relationship type'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setIsSaving(true)
    try {
      const supabase = createClient()

      if (isEditing && editingRelationship) {
        await updateRelationship(supabase, editingRelationship.id, {
          relationship_type: relationshipType,
          label: customLabel || null,
        })
      } else {
        await addRelationship(
          supabase,
          userId,
          fromProfileId,
          toProfileId,
          relationshipType,
          customLabel || undefined
        )
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save relationship')
    } finally {
      setIsSaving(false)
    }
  }

  const title = isEditing ? 'Edit Relationship' : 'Add Relationship'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title icon */}
        <div className="flex items-center gap-2 -mt-2 mb-2">
          <Link2 className="w-4 h-4 text-accent-primary" />
          <span className="text-sm text-ink-muted">
            {isEditing ? 'Update the relationship details' : 'Connect two people in your story'}
          </span>
        </div>

        {/* From person */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">From</label>
          <select
            value={fromProfileId}
            onChange={(e) => {
              setFromProfileId(e.target.value)
              // If the selected "from" is the same as "to", reset "to"
              if (e.target.value === toProfileId) {
                setToProfileId('')
              }
              setValidationErrors((prev) => ({ ...prev, from: '' }))
            }}
            disabled={isEditing}
            className="w-full rounded-lg border border-ink-border/50 bg-ink-surface/50 px-3 py-2 text-sm text-ink-text focus:border-accent-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a person...</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
                {profile.nickname ? ` (${profile.nickname})` : ''}
              </option>
            ))}
          </select>
          {validationErrors.from && (
            <p className="text-xs text-status-error mt-1">{validationErrors.from}</p>
          )}
        </div>

        {/* To person */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">To</label>
          <select
            value={toProfileId}
            onChange={(e) => {
              setToProfileId(e.target.value)
              setValidationErrors((prev) => ({ ...prev, to: '' }))
            }}
            disabled={isEditing}
            className="w-full rounded-lg border border-ink-border/50 bg-ink-surface/50 px-3 py-2 text-sm text-ink-text focus:border-accent-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a person...</option>
            {availableToProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
                {profile.nickname ? ` (${profile.nickname})` : ''}
              </option>
            ))}
          </select>
          {validationErrors.to && (
            <p className="text-xs text-status-error mt-1">{validationErrors.to}</p>
          )}
        </div>

        {/* Relationship type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">Relationship Type</label>
          <select
            value={relationshipType}
            onChange={(e) => {
              setRelationshipType(e.target.value)
              setValidationErrors((prev) => ({ ...prev, type: '' }))
            }}
            className="w-full rounded-lg border border-ink-border/50 bg-ink-surface/50 px-3 py-2 text-sm text-ink-text focus:border-accent-primary focus:outline-none"
          >
            <option value="">Select type...</option>
            {RELATIONSHIP_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label} — {rt.description}
              </option>
            ))}
          </select>
          {validationErrors.type && (
            <p className="text-xs text-status-error mt-1">{validationErrors.type}</p>
          )}
        </div>

        {/* Custom label */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">Custom Label (optional)</label>
          <Input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g., best friend since college"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-status-error mt-1">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={isSaving} size="sm">
            {isEditing ? 'Update' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StoryProfileForm } from './StoryProfileForm'
import type { StoryProfile, StoryProfileType } from '@/types'

interface StoryProfileSectionProps {
  type: StoryProfileType
  title: string
  description: string
}

export function StoryProfileSection({ type, title, description }: StoryProfileSectionProps) {
  const [profiles, setProfiles] = useState<StoryProfile[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()

  const loadProfiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .order('created_at')
    if (data) setProfiles(data)
  }, [supabase, type])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function handleSave(data: { name: string; relationship: string; nickname: string; details: Record<string, string> }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('story_profiles').insert({
      user_id: user.id,
      type,
      name: data.name,
      relationship: data.relationship || null,
      nickname: data.nickname || null,
      details: data.details,
    })
    setIsAdding(false)
    await loadProfiles()
  }

  async function handleUpdate(id: string, data: { name: string; relationship: string; nickname: string; details: Record<string, string> }) {
    await supabase.from('story_profiles').update({
      name: data.name,
      relationship: data.relationship || null,
      nickname: data.nickname || null,
      details: data.details,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setEditingId(null)
    await loadProfiles()
  }

  async function handleDelete(id: string) {
    await supabase.from('story_profiles').delete().eq('id', id)
    await loadProfiles()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-sm md:text-base text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)}>+ Add</Button>
      </div>

      {profiles.length === 0 && !isAdding && (
        <div className="rounded-lg border border-ink-border bg-ink-card p-4">
          <p className="text-sm text-text-muted text-center">No {title.toLowerCase()} added yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {profiles.map(profile => (
          editingId === profile.id ? (
            <StoryProfileForm
              key={profile.id}
              type={type}
              profile={profile}
              onSave={(data) => handleUpdate(profile.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <Card key={profile.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-ui text-sm text-text-primary font-medium">
                    {profile.name}
                    {profile.relationship && <span className="text-text-muted font-normal"> ({profile.relationship})</span>}
                    {profile.nickname && <span className="text-text-muted font-normal"> &middot; &ldquo;{profile.nickname}&rdquo;</span>}
                  </p>
                  {Object.entries(profile.details || {}).filter(([, v]) => v).length > 0 && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {Object.entries(profile.details).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(profile.id)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(profile.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          )
        ))}

        {isAdding && (
          <StoryProfileForm
            type={type}
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
          />
        )}
      </div>
    </div>
  )
}

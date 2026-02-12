'use client'

import { useState, useEffect, useCallback } from 'react'
import { type LucideIcon, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StoryProfileForm } from './StoryProfileForm'
import type { StoryProfile, StoryProfileType } from '@/types'

interface StoryProfileSectionProps {
  type: StoryProfileType
  title: string
  description: string
  icon?: LucideIcon
}

const typeColors: Record<StoryProfileType, string> = {
  personal: 'bg-accent-primary/20 text-accent-primary',
  character: 'bg-blue-500/20 text-blue-400',
  location: 'bg-emerald-500/20 text-emerald-400',
}

export function StoryProfileSection({ type, title, description, icon: Icon }: StoryProfileSectionProps) {
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
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${typeColors[type]}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <h3 className="font-display text-sm md:text-base text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">{description}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="gap-1">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {profiles.length === 0 && !isAdding && (
        <div className="rounded-xl border border-ink-border/30 bg-ink-surface/20 p-4">
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
            <Card key={profile.id} compact className="bg-ink-surface/30 border-ink-border/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-ui text-sm text-text-primary font-medium flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${typeColors[type].split(' ')[0]}`} />
                    {profile.name}
                    {profile.relationship && <span className="text-text-muted font-normal text-xs">({profile.relationship})</span>}
                    {profile.nickname && <span className="text-text-muted font-normal text-xs">&middot; &ldquo;{profile.nickname}&rdquo;</span>}
                  </p>
                  {Object.entries(profile.details || {}).filter(([, v]) => v).length > 0 && (
                    <p className="text-xs text-text-muted mt-0.5 truncate ml-4">
                      {Object.entries(profile.details).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(profile.id)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(profile.id)} className="text-text-muted hover:text-status-error">Delete</Button>
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

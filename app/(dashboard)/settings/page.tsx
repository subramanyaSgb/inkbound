'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StoryProfileSection } from '@/components/settings/StoryProfileSection'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        if (profile) setDisplayName(profile.display_name || '')
      }
    }
    load()
  }, [supabase])

  async function handleSave() {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }
    setIsSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Settings</h1>

      <div className="space-y-4 md:space-y-6">
        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Profile</h2>
          <div className="space-y-4">
            <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <Input label="Email" value={email} disabled />
            <Button onClick={handleSave} isLoading={isSaving}>Save Profile</Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Account</h2>
          <Button variant="secondary" onClick={handleLogout}>Sign Out</Button>
        </Card>

        <Card>
          <h2 className="font-display text-base md:text-lg text-text-primary mb-4">Story Profiles</h2>
          <p className="text-xs text-text-muted mb-6">Add people and places so the AI gets your story right. These are used across all your novels.</p>
          <div className="space-y-6">
            <StoryProfileSection type="personal" title="Personal Info" description="Your own details for the protagonist" />
            <StoryProfileSection type="character" title="Characters" description="People in your life" />
            <StoryProfileSection type="location" title="Locations" description="Places that appear in your stories" />
          </div>
        </Card>
      </div>
    </div>
  )
}

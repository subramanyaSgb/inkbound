'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, LogOut, Users, MapPin, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StoryProfileSection } from '@/components/settings/StoryProfileSection'
import { profileSchema } from '@/lib/validations'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
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
    const result = profileSchema.safeParse({ displayName })
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-accent-primary" />
              </div>
              <h2 className="font-display text-lg text-text-primary">Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                {errors.displayName && <p className="text-xs text-status-error mt-1">{errors.displayName}</p>}
              </div>
              <Input label="Email" value={email} disabled />
              <Button onClick={handleSave} isLoading={isSaving}>Save Profile</Button>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-status-error/15 bg-status-error/5">
            <div className="flex items-center gap-3 mb-3">
              <LogOut className="w-5 h-5 text-status-error/70" />
              <h2 className="font-display text-lg text-text-primary">Account</h2>
            </div>
            <p className="text-xs text-text-muted mb-3">Sign out of your account on this device.</p>
            <Button variant="outline" onClick={handleLogout} className="border-status-error/30 text-status-error hover:bg-status-error/10">Sign Out</Button>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="glass">
            <h2 className="font-display text-base md:text-lg text-text-primary mb-4">Story Profiles</h2>
            <p className="text-xs text-text-muted mb-6">Add people and places so the AI gets your story right. These are used across all your novels.</p>
            <div className="space-y-6">
              <StoryProfileSection type="personal" title="Personal Info" description="Your own details for the protagonist" icon={UserCircle} />
              <StoryProfileSection type="character" title="Characters" description="People in your life" icon={Users} />
              <StoryProfileSection type="location" title="Locations" description="Places that appear in your stories" icon={MapPin} />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

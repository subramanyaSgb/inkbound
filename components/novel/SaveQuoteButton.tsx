'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SaveQuoteButtonProps {
  text: string
  chapterId: string
  novelId: string
  onSaved: () => void
}

export function SaveQuoteButton({ text, chapterId, novelId, onSaved }: SaveQuoteButtonProps) {
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('saved_quotes').insert({
      user_id: user.id,
      chapter_id: chapterId,
      novel_id: novelId,
      text: text.trim(),
    })

    setIsSaving(false)
    onSaved()
  }

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-card border border-accent-primary/30 text-xs font-ui text-accent-primary hover:bg-ink-highlight transition-all shadow-lg"
    >
      <Bookmark className="w-3.5 h-3.5" />
      {isSaving ? 'Saving...' : 'Save Quote'}
    </button>
  )
}

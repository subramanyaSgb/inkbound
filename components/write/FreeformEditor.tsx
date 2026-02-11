'use client'

import { useEffect, useRef, useState } from 'react'
import { useWriteStore } from '@/stores/write-store'
import { createClient } from '@/lib/supabase/client'
import type { StoryProfile } from '@/types'

export function FreeformEditor() {
  const { rawEntry, setRawEntry } = useWriteStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [profiles, setProfiles] = useState<StoryProfile[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownFilter, setDropdownFilter] = useState('')
  const [mentionStart, setMentionStart] = useState<number>(-1)

  // Load profiles once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('story_profiles')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setProfiles(data)
        })
    })
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, 250)}px`
    }
  }, [rawEntry])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setRawEntry(value)

    // Check if we're in an @mention
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex >= 0) {
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
      const textAfterAt = textBeforeCursor.slice(atIndex + 1)

      if ((charBefore === ' ' || charBefore === '\n' || atIndex === 0) && !/\s/.test(textAfterAt)) {
        setMentionStart(atIndex)
        setDropdownFilter(textAfterAt.toLowerCase())
        setShowDropdown(true)
        return
      }
    }

    setShowDropdown(false)
  }

  function handleSelect(profile: StoryProfile) {
    if (mentionStart < 0) return
    const before = rawEntry.slice(0, mentionStart)
    const cursorPos = textareaRef.current?.selectionStart || mentionStart
    const after = rawEntry.slice(cursorPos)
    const mention = `@${profile.nickname || profile.name} `
    setRawEntry(before + mention + after)
    setShowDropdown(false)

    setTimeout(() => {
      const pos = (before + mention).length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(dropdownFilter) ||
    (p.nickname && p.nickname.toLowerCase().includes(dropdownFilter)) ||
    (p.relationship && p.relationship.toLowerCase().includes(dropdownFilter))
  )

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={rawEntry}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (showDropdown && e.key === 'Escape') {
            setShowDropdown(false)
          }
        }}
        placeholder="Tell me about your day... Use @ to mention people and places."
        className="w-full min-h-[250px] md:min-h-[300px] bg-transparent font-body text-base md:text-lg text-text-primary leading-relaxed placeholder:text-text-muted/50 resize-none focus:outline-none"
      />

      {showDropdown && filteredProfiles.length > 0 && (
        <div className="absolute z-20 mt-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-ink-border bg-ink-card shadow-lg">
          {filteredProfiles.map(profile => (
            <button
              key={profile.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(profile) }}
              className="w-full text-left px-3 py-2 hover:bg-ink-surface transition-colors"
            >
              <p className="text-sm font-ui text-text-primary">
                {profile.name}
                {profile.relationship && (
                  <span className="text-text-muted"> ({profile.relationship})</span>
                )}
              </p>
              {profile.nickname && (
                <p className="text-xs text-text-muted">&ldquo;{profile.nickname}&rdquo;</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

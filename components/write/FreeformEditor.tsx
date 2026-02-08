'use client'

import { useEffect, useRef } from 'react'
import { useWriteStore } from '@/stores/write-store'

export function FreeformEditor() {
  const { rawEntry, setRawEntry } = useWriteStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, 300)}px`
    }
  }, [rawEntry])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <textarea
      ref={textareaRef}
      value={rawEntry}
      onChange={(e) => setRawEntry(e.target.value)}
      placeholder="Tell me about your day... What happened? Who did you see? How did you feel?"
      className="w-full min-h-[300px] bg-transparent font-body text-lg text-text-primary leading-relaxed placeholder:text-text-muted/50 resize-none focus:outline-none"
    />
  )
}

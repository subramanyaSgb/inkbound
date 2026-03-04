'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveEntry } from '@/lib/daily-entries'
import { useEntryStore } from '@/stores/entry-store'

export function useAutoSave(novelId: string | null, entryMode: string = 'freeform') {
  const { currentEntry, markSaved, setSaveStatus } = useEntryStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)

  const syncToSupabase = useCallback(async () => {
    const entry = useEntryStore.getState().currentEntry
    if (!entry || !entry.isDirty || !novelId || !entry.content.trim()) return
    if (isSavingRef.current) return

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const saved = await saveEntry(supabase, {
        novelId,
        userId: user.id,
        content: entry.content,
        entryDate: entry.entryDate,
        entryMode,
        isAutoSave: true,
      })

      if (saved) {
        markSaved(saved.id)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [novelId, entryMode, markSaved, setSaveStatus])

  // Debounced auto-save: restart 15s timer on every content change
  useEffect(() => {
    if (!currentEntry?.isDirty) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      syncToSupabase()
    }, 15000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentEntry?.content, currentEntry?.isDirty, syncToSupabase])

  // Manual save function (immediate)
  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await syncToSupabase()
  }, [syncToSupabase])

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      const entry = useEntryStore.getState().currentEntry
      if (entry?.isDirty && novelId) {
        syncToSupabase()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { saveNow }
}

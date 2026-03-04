'use client'

import { create } from 'zustand'

interface LocalEntry {
  novelId: string
  entryDate: string
  content: string
  entryMode: string
  lastSavedAt: string | null
  isDirty: boolean
}

interface EntryStore {
  currentEntry: LocalEntry | null
  savedEntryId: string | null
  lastSyncedAt: string | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'

  setCurrentEntry: (entry: LocalEntry) => void
  updateContent: (content: string) => void
  markSaved: (entryId: string) => void
  markSynced: () => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  clear: () => void
  loadFromLocalStorage: (novelId: string, entryDate: string) => LocalEntry | null
}

function getLocalStorageKey(novelId: string, entryDate: string) {
  return `inkbound:entry:${novelId}:${entryDate}`
}

function saveToLocalStorage(entry: LocalEntry) {
  try {
    const key = getLocalStorageKey(entry.novelId, entry.entryDate)
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable
  }
}

function readFromLocalStorage(novelId: string, entryDate: string): LocalEntry | null {
  try {
    const key = getLocalStorageKey(novelId, entryDate)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function removeFromLocalStorage(novelId: string, entryDate: string) {
  try {
    const key = getLocalStorageKey(novelId, entryDate)
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const useEntryStore = create<EntryStore>((set, get) => ({
  currentEntry: null,
  savedEntryId: null,
  lastSyncedAt: null,
  saveStatus: 'idle',

  setCurrentEntry: (entry) => {
    set({ currentEntry: entry, saveStatus: 'idle' })
    saveToLocalStorage(entry)
  },

  updateContent: (content) => {
    const current = get().currentEntry
    if (!current) return
    const updated = { ...current, content, isDirty: true }
    set({ currentEntry: updated, saveStatus: 'idle' })
    saveToLocalStorage(updated)
  },

  markSaved: (entryId) => {
    const current = get().currentEntry
    if (!current) return
    const updated = { ...current, isDirty: false, lastSavedAt: new Date().toISOString() }
    set({ currentEntry: updated, savedEntryId: entryId, saveStatus: 'saved', lastSyncedAt: new Date().toISOString() })
    saveToLocalStorage(updated)
  },

  markSynced: () => {
    set({ lastSyncedAt: new Date().toISOString(), saveStatus: 'saved' })
  },

  setSaveStatus: (status) => set({ saveStatus: status }),

  clear: () => {
    const current = get().currentEntry
    if (current) {
      removeFromLocalStorage(current.novelId, current.entryDate)
    }
    set({ currentEntry: null, savedEntryId: null, lastSyncedAt: null, saveStatus: 'idle' })
  },

  loadFromLocalStorage: (novelId, entryDate) => {
    return readFromLocalStorage(novelId, entryDate)
  },
}))

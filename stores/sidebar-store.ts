'use client'

import { create } from 'zustand'
import { useEffect } from 'react'

interface SidebarState {
  collapsed: boolean
  hydrated: boolean
  toggleCollapsed: () => void
  setCollapsed: (v: boolean) => void
  hydrate: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  hydrated: false,
  toggleCollapsed: () => set((state) => {
    const next = !state.collapsed
    localStorage.setItem('sidebar-collapsed', String(next))
    return { collapsed: next }
  }),
  setCollapsed: (v) => {
    localStorage.setItem('sidebar-collapsed', String(v))
    set({ collapsed: v })
  },
  hydrate: () => {
    const stored = localStorage.getItem('sidebar-collapsed') === 'true'
    set({ collapsed: stored, hydrated: true })
  },
}))

/** Call this once in your layout to sync sidebar state from localStorage after mount */
export function useSidebarHydration() {
  const hydrate = useSidebarStore((s) => s.hydrate)
  const hydrated = useSidebarStore((s) => s.hydrated)
  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrate, hydrated])
}

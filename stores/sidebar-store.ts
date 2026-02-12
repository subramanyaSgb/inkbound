'use client'

import { create } from 'zustand'

interface SidebarState {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (v: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: typeof window !== 'undefined'
    ? localStorage.getItem('sidebar-collapsed') === 'true'
    : false,
  toggleCollapsed: () => set((state) => {
    const next = !state.collapsed
    localStorage.setItem('sidebar-collapsed', String(next))
    return { collapsed: next }
  }),
  setCollapsed: (v) => {
    localStorage.setItem('sidebar-collapsed', String(v))
    set({ collapsed: v })
  },
}))

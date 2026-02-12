'use client'

import { useSidebarHydration } from '@/stores/sidebar-store'

/** Invisible component that hydrates sidebar state from localStorage after mount */
export function SidebarHydration() {
  useSidebarHydration()
  return null
}

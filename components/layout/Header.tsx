'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-border bg-ink-bg/80 backdrop-blur-sm px-3 py-2 md:px-4 md:py-3 lg:px-6">
      <h1 className="font-display text-xl md:text-2xl text-accent-primary">Inkbound</h1>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center hover:border-accent-primary/50 transition-colors"
          aria-label="Profile menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 rounded-lg border border-ink-border bg-ink-card shadow-lg overflow-hidden">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-ui text-text-secondary hover:bg-ink-surface hover:text-text-primary transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm font-ui text-text-secondary hover:bg-ink-surface hover:text-status-error transition-colors border-t border-ink-border"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

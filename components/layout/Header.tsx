'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, User } from 'lucide-react'
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-border/50 bg-ink-bg/70 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 lg:px-6">
      <Link href="/">
        <h1 className="font-display text-xl md:text-2xl text-accent-primary">Inkbound</h1>
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center hover:border-accent-primary/40 hover:shadow-glow-sm transition-all min-w-[44px] min-h-[44px]"
          aria-label="Profile menu"
        >
          <User className="w-4 h-4 text-text-secondary" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-44 glass-card rounded-xl shadow-glass overflow-hidden"
            >
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-ui text-text-secondary hover:bg-ink-surface/80 hover:text-text-primary transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="border-t border-ink-border/50" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm font-ui text-text-secondary hover:bg-ink-surface/80 hover:text-status-error transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

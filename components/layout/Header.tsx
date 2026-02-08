'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function Header() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-border bg-ink-bg/80 backdrop-blur-sm px-4 py-3 lg:px-6">
      <h1 className="font-display text-2xl text-accent-primary">Inkbound</h1>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sign Out
      </Button>
    </header>
  )
}

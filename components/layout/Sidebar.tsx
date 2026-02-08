'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Library', icon: '~' },
  { href: '/write', label: 'Write', icon: '>' },
  { href: '/settings', label: 'Settings', icon: '*' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-ink-border bg-ink-surface min-h-screen pt-6 px-3">
      <div className="px-3 mb-8">
        <h1 className="font-display text-2xl text-accent-primary">Inkbound</h1>
        <p className="text-xs text-text-muted mt-1">Your life, bound in ink.</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-ui transition-colors
                ${isActive
                  ? 'bg-ink-highlight text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-ink-card'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

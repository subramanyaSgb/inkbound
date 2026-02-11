'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Library', icon: '~' },
  { href: '/write', label: 'Write', icon: '>' },
  { href: '/settings', label: 'Settings', icon: '*' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-ink-border bg-ink-bg/95 backdrop-blur-sm py-1.5 lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-0 px-3 py-0.5 text-[11px] font-ui transition-colors
              ${isActive ? 'text-accent-primary' : 'text-text-muted'}
            `}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

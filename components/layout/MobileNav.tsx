'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, PenTool, BarChart3, Settings } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Library', Icon: BookOpen },
  { href: '/write', label: 'Write', Icon: PenTool },
  { href: '/stats', label: 'Stats', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-ink-border/50 bg-ink-bg/80 backdrop-blur-md py-1 pb-[env(safe-area-inset-bottom,4px)] lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1 min-w-[44px] min-h-[44px] justify-center"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <item.Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? 'text-accent-primary' : 'text-text-muted'
                }`}
              />
            </motion.div>
            <span className={`text-[10px] font-ui transition-colors duration-200 ${
              isActive ? 'text-accent-primary' : 'text-text-muted'
            }`}>
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="mobile-nav-active"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-primary"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

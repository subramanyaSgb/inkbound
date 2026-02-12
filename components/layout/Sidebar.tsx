'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, PenTool, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'

const navItems = [
  { href: '/', label: 'Library', Icon: BookOpen },
  { href: '/write', label: 'Write', Icon: PenTool },
  { href: '/stats', label: 'Stats', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed } = useSidebarStore()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col border-r border-ink-border bg-ink-surface/50 backdrop-blur-sm min-h-screen pt-6 relative group"
    >
      {/* Logo */}
      <div className="px-4 mb-8 overflow-hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl text-accent-primary flex-shrink-0">I</span>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2 }}
            className="font-display text-xl text-accent-primary whitespace-nowrap overflow-hidden"
          >
            nkbound
          </motion.span>
        </Link>
        <motion.p
          animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.15 }}
          className="text-xs text-text-muted mt-1 overflow-hidden whitespace-nowrap"
        >
          Your life, bound in ink.
        </motion.p>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-ink-border/50 mb-2" />

      {/* Nav items */}
      <nav className="space-y-1 px-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-ui transition-all duration-200
                ${isActive
                  ? 'text-accent-primary bg-ink-highlight'
                  : 'text-text-secondary hover:text-text-primary hover:bg-ink-card/60'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.Icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-ink-border/50 mb-2" />

      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="mx-2 mb-4 flex items-center justify-center gap-2 rounded-lg py-2.5 text-text-muted hover:text-text-primary hover:bg-ink-card/60 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        <motion.span
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.15 }}
          className="text-xs font-ui whitespace-nowrap overflow-hidden"
        >
          Collapse
        </motion.span>
      </button>
    </motion.aside>
  )
}

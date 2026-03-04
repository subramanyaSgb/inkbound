'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, PenTool, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'

const navItems = [
  { href: '/', label: 'Library', Icon: BookOpen, matchExact: true },
  { href: '/write', label: 'Write', Icon: PenTool, matchExact: false },
  { href: '/stats', label: 'Stats', Icon: BarChart3, matchExact: false },
  { href: '/settings', label: 'Settings', Icon: Settings, matchExact: false },
]

function isItemActive(pathname: string, item: typeof navItems[number]): boolean {
  if (item.matchExact) {
    return pathname === '/' || pathname.startsWith('/novel')
  }
  return pathname.startsWith(item.href)
}

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed } = useSidebarStore()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col border-r border-ink-border/50 bg-ink-surface/30 backdrop-blur-md min-h-screen pt-6 relative"
    >
      {/* Subtle inner glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[80px] bg-accent-primary/[0.03] rounded-full blur-[40px] pointer-events-none" />

      {/* Logo */}
      <div className={`mb-8 overflow-hidden relative transition-all duration-300 ${collapsed ? 'px-0 flex flex-col items-center' : 'px-4'}`}>
        <Link href="/" className="inline-flex items-center">
          <span className="font-display text-2xl text-accent-primary">I</span>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2 }}
            className="font-display text-xl text-gradient whitespace-nowrap overflow-hidden"
          >
            nkbound
          </motion.span>
        </Link>
        <motion.p
          animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.15 }}
          className="text-[10px] text-text-muted/60 mt-1 overflow-hidden whitespace-nowrap font-body italic"
        >
          Your life, bound in ink.
        </motion.p>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-accent-primary/15 to-transparent" />

      {/* Nav items */}
      <nav className="space-y-1 px-2 flex-1 relative">
        {navItems.map((item) => {
          const isActive = isItemActive(pathname, item)
          return (
            <div key={item.href} className="relative">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent-primary rounded-r-full shadow-glow-sm z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Link
                href={item.href}
                className={`
                  relative flex items-center rounded-xl py-2.5 text-sm font-ui transition-all duration-300
                  ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}
                  ${isActive
                    ? 'text-accent-primary bg-accent-primary/[0.08] border border-accent-primary/15 shadow-glow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-ink-card/40 border border-transparent'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-accent-primary' : ''}`} />
                <motion.span
                  animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-accent-primary/15 to-transparent" />

      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="mx-2 mb-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-text-muted hover:text-accent-primary/70 hover:bg-accent-primary/[0.05] transition-all duration-300"
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

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'The ink flows best at night'
  if (hour < 12) return 'Good morning, storyteller'
  if (hour < 17) return 'Good afternoon, storyteller'
  if (hour < 21) return 'Good evening, storyteller'
  return 'The ink flows best at night'
}

export function LibraryHeader({ novelCount }: { novelCount: number }) {
  return (
    <div className="relative mb-6 md:mb-8">
      {/* Ambient glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-accent-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-body text-sm text-accent-primary/70 italic mb-1 tracking-wide">
              {getGreeting()}
            </p>
            <h1 className="font-display text-2xl md:text-3xl text-gradient leading-tight">
              Your Library
            </h1>
            <p className="text-xs text-text-muted mt-1 hidden md:block font-body italic">
              {novelCount} novel{novelCount !== 1 ? 's' : ''} — every chapter a piece of your story
            </p>
          </div>
          <Link href="/novel/new">
            <Button variant="glow">
              <Plus className="w-4 h-4 mr-1.5" />
              New Novel
            </Button>
          </Link>
        </div>

        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
          <BookOpen className="w-3 h-3 text-accent-primary/30" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        </div>
      </motion.div>
    </div>
  )
}

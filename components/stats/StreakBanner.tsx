'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakBannerProps {
  current: number
  longest: number
  total: number
}

export function StreakBanner({ current, longest, total }: StreakBannerProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-accent-primary/15 via-accent-secondary/10 to-ink-card border border-accent-primary/20 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center">
            <Flame className={`w-6 h-6 ${current > 0 ? 'text-accent-primary' : 'text-text-muted'}`} />
          </div>
          <div>
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="font-display text-3xl md:text-4xl text-accent-primary"
            >
              {current}
            </motion.p>
            <p className="text-xs text-text-muted font-ui">day streak</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center glass-card rounded-lg px-3 py-2">
            <p className="font-display text-lg text-text-primary">{longest}</p>
            <p className="text-[10px] text-text-muted font-ui">best</p>
          </div>
          <div className="text-center glass-card rounded-lg px-3 py-2">
            <p className="font-display text-lg text-text-primary">{total}</p>
            <p className="text-[10px] text-text-muted font-ui">entries</p>
          </div>
        </div>
      </div>
    </div>
  )
}

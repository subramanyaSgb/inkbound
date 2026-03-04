'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getWritingStreak } from '@/lib/daily-entries'

interface WritingStreakProps {
  userId: string
}

export function WritingStreak({ userId }: WritingStreakProps) {
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const result = await getWritingStreak(supabase, userId)
      setStreak(result)
    }
    load()
  }, [userId])

  if (!streak || streak.current === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20"
    >
      <Flame className="w-4 h-4 text-accent-primary" />
      <span className="text-sm font-ui text-accent-primary font-medium">
        {streak.current} day streak!
      </span>
      {streak.longest > streak.current && (
        <span className="text-xs text-text-muted/60 font-ui">
          (best: {streak.longest})
        </span>
      )}
    </motion.div>
  )
}

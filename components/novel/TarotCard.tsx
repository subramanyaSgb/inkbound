'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import type { StoryProfile } from '@/types'

const archetypeColors: Record<string, string> = {
  'The Anchor': 'from-blue-900/40 to-cyan-900/20',
  'The Catalyst': 'from-orange-900/40 to-red-900/20',
  'The Rival': 'from-red-900/40 to-rose-900/20',
  'The Mirror': 'from-purple-900/40 to-violet-900/20',
  'The Sage': 'from-emerald-900/40 to-teal-900/20',
  'The Storm': 'from-slate-800/40 to-zinc-900/20',
  'The Light': 'from-amber-900/40 to-yellow-900/20',
}

interface TarotCardProps {
  profile: StoryProfile
  novelId: string
  index?: number
}

export function TarotCard({ profile, novelId, index = 0 }: TarotCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const gradient = archetypeColors[profile.archetype || ''] || 'from-ink-surface to-ink-card'
  const details = Object.entries(profile.details || {}).filter(([, v]) => v)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="relative w-full aspect-[2/3] preserve-3d"
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border border-ink-border/50">
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6`}>
            {profile.portrait_url ? (
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-accent-primary/30 mb-4">
                <Image src={profile.portrait_url} alt={profile.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-ink-card/50 border-2 border-accent-primary/20 flex items-center justify-center mb-4">
                <span className="font-display text-4xl md:text-5xl text-accent-primary/70">{profile.name.charAt(0)}</span>
              </div>
            )}

            <h3 className="font-display text-lg md:text-xl text-text-primary text-center">{profile.name}</h3>
            {profile.archetype && (
              <p className="text-xs font-ui text-accent-primary tracking-widest uppercase mt-1">{profile.archetype}</p>
            )}
            {profile.relationship && (
              <p className="text-xs text-text-muted mt-1">{profile.relationship}</p>
            )}
            {(profile.mention_count ?? 0) > 0 && (
              <p className="text-[10px] text-text-muted/60 mt-2">{profile.mention_count} mentions</p>
            )}

            {/* Tarot border decoration */}
            <div className="absolute inset-3 border border-accent-primary/10 rounded-xl pointer-events-none" />
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden border border-ink-border/50 bg-ink-card">
          <div className="w-full h-full p-5 flex flex-col overflow-y-auto">
            <h3 className="font-display text-lg text-text-primary mb-1">{profile.name}</h3>
            {profile.nickname && (
              <p className="text-xs text-text-muted mb-3">&ldquo;{profile.nickname}&rdquo;</p>
            )}

            {details.length > 0 && (
              <div className="space-y-2 mb-4">
                {details.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{key}</p>
                    <p className="text-sm text-text-secondary">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {profile.first_chapter_id && (
              <Link
                href={`/novel/${novelId}/chapter/${profile.first_chapter_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-accent-primary hover:text-accent-primary/80 mt-auto"
              >
                First appearance →
              </Link>
            )}

            <p className="text-[10px] text-text-muted/50 mt-3 text-center">Tap to flip</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

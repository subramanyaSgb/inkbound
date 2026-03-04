'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Pen, MessageCircle, ClipboardList, Sparkles, ChevronRight } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Burning the midnight oil?'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Late night thoughts?'
}

function getSubtext(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'The best stories are written when the world sleeps.'
  if (hour < 12) return 'A fresh page awaits your morning reflections.'
  if (hour < 17) return 'Capture the rhythm of your day.'
  if (hour < 21) return 'Let the day\'s story unfold on paper.'
  return 'The quiet hours hold the deepest stories.'
}

interface WritePageClientProps {
  novelId: string
  novels: { id: string; title: string }[]
  selectedNovel?: { id: string; title: string }
}

export function WritePageClient({ novelId, novels, selectedNovel }: WritePageClientProps) {
  const greeting = getGreeting()
  const subtext = getSubtext()

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Ambient glow behind heading */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent-primary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mb-8 md:mb-10"
      >
        <p className="font-body text-sm md:text-base text-accent-primary/70 italic mb-1 tracking-wide">
          {greeting}
        </p>
        <h1 className="font-display text-2xl md:text-4xl text-gradient leading-tight mb-2">
          What happened today?
        </h1>

        {novels.length > 1 ? (
          <p className="text-sm text-text-muted font-ui">
            Writing for{' '}
            <span className="text-accent-primary/90">{selectedNovel?.title}</span>
            {' · '}
            <Link href="/write" className="text-text-muted hover:text-accent-primary/70 underline underline-offset-2 decoration-ink-border transition-colors">
              change
            </Link>
          </p>
        ) : (
          <p className="font-body text-sm md:text-base text-text-muted italic">{subtext}</p>
        )}

        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
          <Sparkles className="w-3 h-3 text-accent-primary/30" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
        </div>
      </motion.div>

      {/* Hero card — Free Write */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Link href={`/write/freeform?novelId=${novelId}`} className="block group">
          <div className="relative overflow-hidden rounded-2xl border border-accent-primary/15 bg-gradient-to-br from-ink-card via-ink-surface to-ink-card p-5 md:p-7 transition-all duration-500 hover:border-accent-primary/30 hover:shadow-glow-md hover:-translate-y-0.5">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none">
              <div className="absolute top-4 right-4 w-20 h-20 border border-accent-primary rounded-full" />
              <div className="absolute top-8 right-8 w-12 h-12 border border-accent-primary rounded-full" />
              <div className="absolute top-11 right-11 w-6 h-6 border border-accent-primary rounded-full" />
            </div>

            {/* Subtle shimmer line on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
            </div>

            <div className="flex items-start gap-4 md:gap-5">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-primary/15 group-hover:border-accent-primary/30 transition-all duration-500 group-hover:shadow-glow-sm">
                <Pen className="w-5 h-5 md:w-6 md:h-6 text-accent-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-lg md:text-xl text-text-primary group-hover:text-accent-primary transition-colors duration-300">
                    Free Write
                  </h3>
                  <span className="text-[10px] font-ui font-medium uppercase tracking-widest text-accent-primary/60 bg-accent-primary/[0.07] px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                </div>
                <p className="font-body text-sm md:text-base text-text-secondary leading-relaxed">
                  Just dump your thoughts — messy, raw, unfiltered. The AI weaves it into beautiful prose.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0 mt-1 hidden md:block" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* AI Mode divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex items-center gap-3 my-6 md:my-7"
      >
        <div className="flex-1 h-px bg-ink-border/30" />
        <span className="text-[10px] font-ui text-text-muted uppercase tracking-[0.2em]">AI-Guided</span>
        <div className="flex-1 h-px bg-ink-border/30" />
      </motion.div>

      {/* AI mode cards — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Link href={`/write/conversation?novelId=${novelId}`} className="block group h-full">
            <div className="relative overflow-hidden rounded-2xl glass-card p-5 h-full transition-all duration-500 hover:border-accent-primary/25 hover:shadow-glow-sm hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-accent-primary/[0.07] border border-accent-primary/15 flex items-center justify-center mb-3 group-hover:bg-accent-primary/10 group-hover:border-accent-primary/25 transition-all duration-500">
                <MessageCircle className="w-4.5 h-4.5 text-accent-primary/80" />
              </div>
              <h3 className="font-display text-base md:text-lg text-text-primary group-hover:text-accent-primary transition-colors duration-300 mb-1">
                AI Conversation
              </h3>
              <p className="font-body text-sm text-text-muted leading-relaxed">
                Answer guided questions one by one — like chatting with a curious friend.
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Link href={`/write/structured?novelId=${novelId}`} className="block group h-full">
            <div className="relative overflow-hidden rounded-2xl glass-card p-5 h-full transition-all duration-500 hover:border-accent-primary/25 hover:shadow-glow-sm hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-accent-primary/[0.07] border border-accent-primary/15 flex items-center justify-center mb-3 group-hover:bg-accent-primary/10 group-hover:border-accent-primary/25 transition-all duration-500">
                <ClipboardList className="w-4.5 h-4.5 text-accent-primary/80" />
              </div>
              <h3 className="font-display text-base md:text-lg text-text-primary group-hover:text-accent-primary transition-colors duration-300 mb-1">
                Structured Prompts
              </h3>
              <p className="font-body text-sm text-text-muted leading-relaxed">
                Fill in card-based sections at your own pace — mood, events, reflections.
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom decorative element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex justify-center mt-8 md:mt-10"
      >
        <p className="font-body text-xs text-text-muted/50 italic">
          Every great story begins with a single entry.
        </p>
      </motion.div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FALLBACK = [
  'Crafting your story...',
  'Weaving words together...',
  'Turning your day into art...',
]

async function fetchRandomFact(): Promise<string> {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.text
  } catch {
    return FALLBACK[Math.floor(Math.random() * FALLBACK.length)]
  }
}

export function GeneratingAnimation() {
  const [currentItem, setCurrentItem] = useState('')
  const [displayedText, setDisplayedText] = useState('')
  const [visible, setVisible] = useState(true)
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const loadNext = useCallback(async () => {
    const fact = await fetchRandomFact()
    if (mountedRef.current) setCurrentItem(fact)
  }, [])

  // Fetch first fact on mount
  useEffect(() => {
    mountedRef.current = true
    loadNext()
    return () => { mountedRef.current = false }
  }, [loadNext])

  // Typewriter effect
  useEffect(() => {
    if (!currentItem) return
    setDisplayedText('')
    setVisible(true)
    let charIndex = 0

    function typeNext() {
      if (charIndex < currentItem.length) {
        charIndex++
        setDisplayedText(currentItem.slice(0, charIndex))
        typingRef.current = setTimeout(typeNext, 35)
      }
    }

    typingRef.current = setTimeout(typeNext, 300)

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
    }
  }, [currentItem])

  // Cycle every 10 seconds — fetch a new fact each time
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        loadNext()
      }, 600)
    }, 10000)

    return () => clearInterval(interval)
  }, [loadNext])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-bg/95 backdrop-blur-md px-6"
    >
      {/* Subtle particle/star background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent-primary/20 rounded-full"
            style={{
              left: `${20 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Animated ring pulse */}
      <div className="relative mb-10">
        <motion.div
          className="w-4 h-4 rounded-full bg-accent-primary"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-accent-primary/30"
          animate={{
            scale: [1, 3],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </div>

      {/* Typewriter text in glass container */}
      <div className="h-28 flex items-center justify-center max-w-md w-full glass-card rounded-2xl px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentItem}
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="font-body text-base md:text-lg text-text-primary text-center leading-relaxed"
          >
            {displayedText}
            <span className="inline-block w-0.5 h-5 bg-accent-primary ml-0.5 animate-pulse align-text-bottom" />
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Bottom text */}
      <motion.p
        className="font-ui text-xs text-text-muted mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Crafting your chapter...
      </motion.p>
    </motion.div>
  )
}

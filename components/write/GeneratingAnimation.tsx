'use client'

import { motion } from 'framer-motion'

const inkPhrases = [
  'Dipping the quill...',
  'The ink begins to flow...',
  'Weaving your story...',
  'Turning moments into prose...',
  'The chapter takes shape...',
  'Finding the right words...',
  'Your day becomes literature...',
]

export function GeneratingAnimation() {
  const phrase = inkPhrases[Math.floor(Math.random() * inkPhrases.length)]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-bg/95 backdrop-blur-sm"
    >
      <motion.div
        className="w-3 h-3 rounded-full bg-accent-primary mb-8"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.p
        className="font-body text-xl text-text-primary"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {phrase}
      </motion.p>

      <motion.p
        className="font-ui text-sm text-text-muted mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        This usually takes 10-20 seconds
      </motion.p>
    </motion.div>
  )
}

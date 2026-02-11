'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const contentPool = [
  // Writing facts
  'Tolkien took 12 years to write Lord of the Rings.',
  'Victor Hugo wrote The Hunchback of Notre-Dame in just 6 months.',
  'Charles Dickens published most of his novels as weekly serials.',
  'Agatha Christie is the best-selling fiction writer of all time — 2 billion copies sold.',
  'The longest novel ever written is "In Search of Lost Time" — 1.2 million words.',

  // Funny quotes
  '"I can write better than anybody who can write faster, and faster than anybody who can write better." — A.J. Liebling',
  '"Writing is easy. All you have to do is cross out the wrong words." — Mark Twain',
  '"I love deadlines. I love the whooshing noise they make as they go by." — Douglas Adams',
  '"The first draft of anything is garbage." — Ernest Hemingway',
  '"If you want to be a writer, you must do two things: read a lot and write a lot." — Stephen King',

  // Motivational
  '"Start writing, no matter what. The water does not flow until the faucet is turned on." — Louis L\'Amour',
  '"There is no greater agony than bearing an untold story inside you." — Maya Angelou',
  '"You can always edit a bad page. You can\'t edit a blank page." — Jodi Picoult',
  '"We write to taste life twice, in the moment and in retrospect." — Anais Nin',
  '"A writer is someone for whom writing is more difficult than it is for other people." — Thomas Mann',

  // Random trivia
  'Octopuses have three hearts and blue blood.',
  'Honey never spoils — edible honey was found in 3,000-year-old Egyptian tombs.',
  'A group of flamingos is called a "flamboyance."',
  'The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896).',
  'Bananas are technically berries, but strawberries aren\'t.',

  // Book facts
  'The first novel ever written is "The Tale of Genji" from 1010 AD.',
  'The Bible is the most shoplifted book in the world.',
  'Dr. Seuss wrote "Green Eggs and Ham" using only 50 different words.',
  'Shakespeare invented over 1,700 words we still use today.',
  'J.K. Rowling was rejected by 12 publishers before Harry Potter was accepted.',

  // More writing facts
  'Leo Tolstoy\'s wife hand-copied War and Peace seven times.',
  'The word "nerd" was first used by Dr. Seuss in "If I Ran the Zoo" (1950).',
  'Franz Kafka asked his friend to burn all his unpublished works. His friend didn\'t.',
  'Maya Angelou rented a hotel room to write in — she never slept there.',
  'Stephen King writes 2,000 words every single day, including holidays.',
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function GeneratingAnimation() {
  const [items] = useState(() => shuffleArray(contentPool))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [visible, setVisible] = useState(true)
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentItem = items[currentIndex % items.length]

  // Typewriter effect: type out the current item character by character
  useEffect(() => {
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

  // Cycle to next item every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, 600)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-bg/95 backdrop-blur-sm px-6"
    >
      {/* Ink drop */}
      <motion.div
        className="w-3 h-3 rounded-full bg-accent-primary mb-10"
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

      {/* Typewriter text */}
      <div className="h-24 flex items-center justify-center max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { GENRES, POVS, WRITING_STYLES } from '@/lib/constants'
import type { Genre, POV, WritingStyle } from '@/types'

export default function NewNovelPage() {
  const [title, setTitle] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [genre, setGenre] = useState<Genre>('literary')
  const [pov, setPov] = useState<POV>('first')
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('modern')
  const [startDate, setStartDate] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('novels')
      .insert({
        user_id: user.id,
        title,
        character_name: characterName || 'the protagonist',
        genre,
        pov,
        writing_style: writingStyle,
        start_date: startDate || null,
        description: description || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
    } else {
      router.push(`/novel/${data.id}`)
    }
  }

  const stagger = {
    hidden: { opacity: 0, y: 15 },
    show: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: 0.35 }
    }),
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8"
      >
        Create a New Novel
      </motion.h1>

      <form onSubmit={handleCreate} className="space-y-4 md:space-y-6">
        <motion.div custom={0} initial="hidden" animate="show" variants={stagger}>
          <Card variant="glass">
            <div className="space-y-4">
              <Input
                label="Novel Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Life Story"
                required
              />
              <Input
                label="Protagonist Name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="What should we call you in the novel?"
              />
              <Input
                label="Start Date (optional)"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <div>
                <label className="block text-sm font-ui text-text-secondary mb-1.5">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this novel about?"
                  className="w-full rounded-lg border border-ink-border bg-ink-surface/80 px-4 py-2.5 font-ui text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:bg-ink-glass focus:backdrop-blur-sm focus:border-accent-primary/50 focus:shadow-glow-sm transition-all duration-200 min-h-[80px] resize-y"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Genre Selection */}
        <motion.div custom={1} initial="hidden" animate="show" variants={stagger}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Genre</h2>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGenre(g.value as Genre)}
                  className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${genre === g.value
                    ? 'border-accent-primary/50 bg-ink-highlight text-accent-primary shadow-glow-sm'
                    : 'border-ink-border/50 bg-ink-surface/50 text-text-secondary hover:border-text-muted hover:bg-ink-surface/80'
                  }`}
                >
                  {genre === g.value && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-accent-primary" />
                  )}
                  <p className="font-ui text-sm font-medium">{g.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{g.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* POV Selection */}
        <motion.div custom={2} initial="hidden" animate="show" variants={stagger}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Point of View</h2>
            <div className="grid grid-cols-3 gap-2">
              {POVS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPov(p.value as POV)}
                  className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${pov === p.value
                    ? 'border-accent-primary/50 bg-ink-highlight text-accent-primary shadow-glow-sm'
                    : 'border-ink-border/50 bg-ink-surface/50 text-text-secondary hover:border-text-muted hover:bg-ink-surface/80'
                  }`}
                >
                  {pov === p.value && (
                    <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-accent-primary" />
                  )}
                  <p className="font-ui text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Writing Style Selection */}
        <motion.div custom={3} initial="hidden" animate="show" variants={stagger}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Writing Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {WRITING_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setWritingStyle(s.value as WritingStyle)}
                  className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${writingStyle === s.value
                    ? 'border-accent-primary/50 bg-ink-highlight text-accent-primary shadow-glow-sm'
                    : 'border-ink-border/50 bg-ink-surface/50 text-text-secondary hover:border-text-muted hover:bg-ink-surface/80'
                  }`}
                >
                  {writingStyle === s.value && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-accent-primary" />
                  )}
                  <p className="font-ui text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {error && <p className="text-sm text-status-error">{error}</p>}

        <motion.div custom={4} initial="hidden" animate="show" variants={stagger}>
          <Button type="submit" isLoading={isLoading} size="lg" className="w-full" variant="glow">
            Create Novel
          </Button>
        </motion.div>
      </form>
    </div>
  )
}

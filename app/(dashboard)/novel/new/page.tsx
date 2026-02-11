'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Create a New Novel</h1>

      <form onSubmit={handleCreate} className="space-y-4 md:space-y-6">
        <Card>
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
              <label className="block text-sm font-ui text-text-secondary mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this novel about?"
                className="w-full rounded-lg border border-ink-border bg-ink-surface px-4 py-2.5 font-ui text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary min-h-[80px] resize-y"
              />
            </div>
          </div>
        </Card>

        {/* Genre Selection */}
        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Genre</h2>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGenre(g.value as Genre)}
                className={`p-3 rounded-lg border text-left transition-all ${genre === g.value ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border bg-ink-surface text-text-secondary hover:border-text-muted'}`}
              >
                <p className="font-ui text-sm font-medium">{g.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{g.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* POV Selection */}
        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Point of View</h2>
          <div className="grid grid-cols-3 gap-2">
            {POVS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPov(p.value as POV)}
                className={`p-3 rounded-lg border text-left transition-all ${pov === p.value ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border bg-ink-surface text-text-secondary hover:border-text-muted'}`}
              >
                <p className="font-ui text-sm font-medium">{p.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{p.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Writing Style Selection */}
        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Writing Style</h2>
          <div className="grid grid-cols-2 gap-2">
            {WRITING_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setWritingStyle(s.value as WritingStyle)}
                className={`p-3 rounded-lg border text-left transition-all ${writingStyle === s.value ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border bg-ink-surface text-text-secondary hover:border-text-muted'}`}
              >
                <p className="font-ui text-sm font-medium">{s.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {error && <p className="text-sm text-status-error">{error}</p>}

        <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
          Create Novel
        </Button>
      </form>
    </div>
  )
}

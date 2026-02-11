'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { GENRES, POVS, WRITING_STYLES } from '@/lib/constants'
import type { Novel, Genre, POV, WritingStyle } from '@/types'

export default function NovelSettingsPage({ params }: { params: { novelId: string } }) {
  const [novel, setNovel] = useState<Novel | null>(null)
  const [title, setTitle] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [genre, setGenre] = useState<Genre>('literary')
  const [pov, setPov] = useState<POV>('first')
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('modern')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('novels')
        .select('*')
        .eq('id', params.novelId)
        .single()
      if (data) {
        setNovel(data)
        setTitle(data.title)
        setCharacterName(data.character_name)
        setGenre(data.genre as Genre)
        setPov(data.pov as POV)
        setWritingStyle(data.writing_style as WritingStyle)
      }
    }
    load()
  }, [params.novelId, supabase])

  async function handleSave() {
    setIsSaving(true)
    await supabase
      .from('novels')
      .update({
        title,
        character_name: characterName,
        genre,
        pov,
        writing_style: writingStyle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.novelId)
    setIsSaving(false)
    router.push(`/novel/${params.novelId}`)
  }

  async function handleDelete() {
    setIsDeleting(true)
    await supabase.from('novels').delete().eq('id', params.novelId)
    router.push('/')
  }

  if (!novel) return null

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-text-muted hover:text-text-secondary mb-6 inline-block">
        &larr; Back
      </button>
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Novel Settings</h1>

      <div className="space-y-4 md:space-y-6">
        <Card>
          <div className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input label="Protagonist Name" value={characterName} onChange={(e) => setCharacterName(e.target.value)} />
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Genre</h2>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map((g) => (
              <button key={g.value} type="button" onClick={() => setGenre(g.value as Genre)}
                className={`p-3 rounded-lg border text-left transition-all ${genre === g.value ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border bg-ink-surface text-text-secondary hover:border-text-muted'}`}>
                <p className="font-ui text-sm font-medium">{g.label}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">POV</h2>
          <div className="grid grid-cols-3 gap-2">
            {POVS.map((p) => (
              <button key={p.value} type="button" onClick={() => setPov(p.value as POV)}
                className={`p-3 rounded-lg border text-left transition-all ${pov === p.value ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border bg-ink-surface text-text-secondary hover:border-text-muted'}`}>
                <p className="font-ui text-sm font-medium">{p.label}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg text-text-primary mb-4">Writing Style</h2>
          <div className="grid grid-cols-2 gap-2">
            {WRITING_STYLES.map((s) => (
              <button key={s.value} type="button" onClick={() => setWritingStyle(s.value as WritingStyle)}
                className={`p-3 rounded-lg border text-left transition-all ${writingStyle === s.value ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border bg-ink-surface text-text-secondary hover:border-text-muted'}`}>
                <p className="font-ui text-sm font-medium">{s.label}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} isLoading={isSaving} className="flex-1">Save Changes</Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete Novel</Button>
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Novel">
        <p className="text-text-secondary mb-6">
          This will permanently delete &ldquo;{novel.title}&rdquo; and all its chapters. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>Delete Forever</Button>
        </div>
      </Modal>
    </div>
  )
}

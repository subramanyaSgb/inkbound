'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { GENRES, POVS, WRITING_STYLES } from '@/lib/constants'
import { updateNovelSchema } from '@/lib/validations'
import type { Novel, Genre, POV, WritingStyle } from '@/types'

export default function NovelSettingsPage({ params }: { params: { novelId: string } }) {
  const [novel, setNovel] = useState<Novel | null>(null)
  const [title, setTitle] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [genre, setGenre] = useState<Genre>('literary')
  const [pov, setPov] = useState<POV>('first')
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('modern')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
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
        setCoverUrl(data.cover_image_url)
      }
    }
    load()
  }, [params.novelId, supabase])

  async function handleSave() {
    const result = updateNovelSchema.safeParse({ title, characterName })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

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
      <button onClick={() => router.back()} className="text-sm text-text-muted hover:text-text-secondary mb-6 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Novel Settings</h1>

      <div className="space-y-4 md:space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass">
            <div className="space-y-4">
              <div>
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                {errors.title && <p className="text-xs text-status-error mt-1">{errors.title}</p>}
              </div>
              <div>
                <Input label="Protagonist Name" value={characterName} onChange={(e) => setCharacterName(e.target.value)} />
                {errors.characterName && <p className="text-xs text-status-error mt-1">{errors.characterName}</p>}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Genre</h2>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <button key={g.value} type="button" onClick={() => setGenre(g.value as Genre)}
                  className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${genre === g.value
                    ? 'border-accent-primary/50 bg-ink-highlight text-accent-primary shadow-glow-sm'
                    : 'border-ink-border/50 bg-ink-surface/50 text-text-secondary hover:border-text-muted hover:bg-ink-surface/80'
                  }`}>
                  {genre === g.value && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-accent-primary" />}
                  <p className="font-ui text-sm font-medium">{g.label}</p>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">POV</h2>
            <div className="grid grid-cols-3 gap-2">
              {POVS.map((p) => (
                <button key={p.value} type="button" onClick={() => setPov(p.value as POV)}
                  className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${pov === p.value
                    ? 'border-accent-primary/50 bg-ink-highlight text-accent-primary shadow-glow-sm'
                    : 'border-ink-border/50 bg-ink-surface/50 text-text-secondary hover:border-text-muted hover:bg-ink-surface/80'
                  }`}>
                  {pov === p.value && <Check className="absolute top-2 right-2 w-3 h-3 text-accent-primary" />}
                  <p className="font-ui text-sm font-medium">{p.label}</p>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Writing Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {WRITING_STYLES.map((s) => (
                <button key={s.value} type="button" onClick={() => setWritingStyle(s.value as WritingStyle)}
                  className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${writingStyle === s.value
                    ? 'border-accent-primary/50 bg-ink-highlight text-accent-primary shadow-glow-sm'
                    : 'border-ink-border/50 bg-ink-surface/50 text-text-secondary hover:border-text-muted hover:bg-ink-surface/80'
                  }`}>
                  {writingStyle === s.value && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-accent-primary" />}
                  <p className="font-ui text-sm font-medium">{s.label}</p>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Book Cover</h2>
            {coverUrl && (
              <div className="relative aspect-square w-32 rounded-lg overflow-hidden border border-ink-border/50 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs text-text-muted mb-3">
              AI generates a cover based on your novel&apos;s genre, moods, and themes.
            </p>
            {coverError && (
              <p className="text-xs text-status-error mb-3">{coverError}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              isLoading={isGeneratingCover}
              onClick={async () => {
                setIsGeneratingCover(true)
                setCoverError(null)
                try {
                  // 1. Get AI-built prompt from server
                  const res = await fetch('/api/generate-cover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ novelId: params.novelId }),
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    setCoverError(data.error || 'Failed to build cover prompt')
                    setIsGeneratingCover(false)
                    return
                  }

                  // 2. Generate image client-side via Puter.js (free, no API key)
                  if (typeof puter === 'undefined') {
                    setCoverError('Image service not loaded. Please refresh and try again.')
                    setIsGeneratingCover(false)
                    return
                  }
                  const imgEl = await puter.ai.txt2img(data.prompt, {
                    model: 'stabilityai/stable-diffusion-xl-base-1.0',
                    width: 1024,
                    height: 1024,
                  })

                  // 3. Convert image element to blob
                  const canvas = document.createElement('canvas')
                  canvas.width = imgEl.naturalWidth || 1024
                  canvas.height = imgEl.naturalHeight || 1024
                  const ctx = canvas.getContext('2d')!
                  ctx.drawImage(imgEl, 0, 0)
                  const blob = await new Promise<Blob>((resolve) =>
                    canvas.toBlob((b) => resolve(b!), 'image/png')
                  )

                  // 4. Upload to Supabase storage
                  const fileName = `covers/${data.userId}/${params.novelId}/${Date.now()}.png`
                  const { error: uploadError } = await supabase.storage
                    .from('covers')
                    .upload(fileName, blob, { contentType: 'image/png', upsert: true })
                  if (uploadError) {
                    setCoverError(`Upload failed: ${uploadError.message}`)
                    setIsGeneratingCover(false)
                    return
                  }

                  // 5. Get public URL and update novel
                  const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
                  await supabase
                    .from('novels')
                    .update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() })
                    .eq('id', params.novelId)
                  setCoverUrl(publicUrl)
                } catch (err) {
                  setCoverError(err instanceof Error ? err.message : 'Cover generation failed. Please try again.')
                }
                setIsGeneratingCover(false)
              }}
            >
              {coverUrl ? 'Regenerate Cover' : 'Generate Cover'}
            </Button>
          </Card>
        </motion.div>

        <div className="flex gap-3">
          <Button onClick={handleSave} isLoading={isSaving} variant="glow" className="flex-1">Save Changes</Button>
        </div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-status-error/20 bg-status-error/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-ui text-sm font-medium text-status-error">Danger Zone</h3>
                <p className="text-xs text-text-muted mt-1 mb-3">Permanently delete this novel and all its chapters.</p>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>Delete Novel</Button>
              </div>
            </div>
          </Card>
        </motion.div>
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

'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ChapterReader } from './ChapterReader'
import { AlternateChapterView } from './AlternateChapterView'
import { GenrePickerModal } from './GenrePickerModal'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import type { Chapter, AlternateChapter } from '@/types'
import { AU_GENRES } from '@/lib/ai/alternate-prompts'

interface ChapterPageClientProps {
  chapter: Chapter
  novelId: string
  alternates: AlternateChapter[]
}

export function ChapterPageClient({ chapter, novelId, alternates: initialAlternates }: ChapterPageClientProps) {
  const [activeTab, setActiveTab] = useState('original')
  const [showGenrePicker, setShowGenrePicker] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [alternates] = useState(initialAlternates)

  const [genError, setGenError] = useState('')

  async function handleGenreSelect(genre: string) {
    setIsGenerating(true)
    setGenError('')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)

    try {
      const response = await fetch('/api/generate-alternate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id, genre }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) throw new Error('Failed')
      setShowGenrePicker(false)
      window.location.reload()
    } catch (err: unknown) {
      clearTimeout(timeout)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGenError('Taking too long. Please check your novel — it may still be processing.')
      } else {
        setGenError(err instanceof Error ? err.message : 'Something went wrong')
      }
      setIsGenerating(false)
    }
  }

  const activeAlt = alternates.find(a => a.genre === activeTab)
  const existingGenres = alternates.map(a => a.genre)

  return (
    <>
      {/* Tab bar */}
      {alternates.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-6 border-b border-ink-border/30 scrollbar-hide">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1.5 rounded-lg text-xs font-ui whitespace-nowrap transition-all ${
              activeTab === 'original'
                ? 'bg-ink-highlight text-accent-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Original
          </button>
          {alternates.map(alt => {
            const genreInfo = AU_GENRES.find(g => g.value === alt.genre)
            return (
              <button
                key={alt.id}
                onClick={() => setActiveTab(alt.genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui whitespace-nowrap transition-all ${
                  activeTab === alt.genre
                    ? 'bg-ink-highlight text-accent-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {genreInfo?.icon} {genreInfo?.label || alt.genre}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {activeTab === 'original' ? (
        <ChapterReader chapter={chapter} novelId={novelId} />
      ) : activeAlt ? (
        <AlternateChapterView alt={activeAlt} />
      ) : null}

      {/* Reimagine button */}
      <div className="flex justify-center mt-8">
        <Button
          variant="outline"
          onClick={() => setShowGenrePicker(true)}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Reimagine This Day
        </Button>
      </div>

      {genError && <p className="text-sm text-status-error mt-3">{genError}</p>}

      <GenrePickerModal
        isOpen={showGenrePicker}
        onClose={() => setShowGenrePicker(false)}
        onSelect={handleGenreSelect}
        isGenerating={isGenerating}
        existingGenres={existingGenres}
      />

      {isGenerating && <GeneratingAnimation />}
    </>
  )
}

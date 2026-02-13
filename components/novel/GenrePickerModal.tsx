'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AU_GENRES } from '@/lib/ai/alternate-prompts'

interface GenrePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (genre: string) => void
  isGenerating: boolean
  existingGenres: string[]
}

export function GenrePickerModal({ isOpen, onClose, onSelect, isGenerating, existingGenres }: GenrePickerModalProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reimagine This Day">
      <p className="text-sm text-text-secondary mb-4">Pick an alternate universe genre. The AI will rewrite this chapter keeping all your real events.</p>
      <div className="grid grid-cols-1 gap-2 mb-6">
        {AU_GENRES.map(g => {
          const alreadyExists = existingGenres.includes(g.value)
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => !alreadyExists && setSelected(g.value)}
              disabled={alreadyExists}
              className={`p-3 rounded-lg border text-left transition-all ${
                selected === g.value
                  ? 'border-accent-primary/50 bg-ink-highlight shadow-glow-sm'
                  : alreadyExists
                    ? 'border-ink-border/30 bg-ink-surface/30 opacity-50 cursor-not-allowed'
                    : 'border-ink-border/50 bg-ink-surface/50 hover:border-text-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{g.icon}</span>
                <div>
                  <p className="font-ui text-sm font-medium text-text-primary">
                    {g.label}
                    {alreadyExists && <span className="text-text-muted font-normal ml-2">(already generated)</span>}
                  </p>
                  <p className="text-xs text-text-muted">{g.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="glow"
          disabled={!selected}
          isLoading={isGenerating}
          onClick={() => selected && onSelect(selected)}
        >
          Reimagine
        </Button>
      </div>
    </Modal>
  )
}

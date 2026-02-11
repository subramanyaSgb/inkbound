'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWriteStore } from '@/stores/write-store'
import { FreeformEditor } from '@/components/write/FreeformEditor'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export default function FreeformWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const chapterId = searchParams.get('chapterId')
  const router = useRouter()
  const { rawEntry, entryDate, setEntryDate, setSelectedNovelId, setRawEntry, isGenerating, setIsGenerating, setEditingChapterId, reset } = useWriteStore()
  const [error, setError] = useState('')
  const [isLoadingEntry, setIsLoadingEntry] = useState(false)
  const isEditing = !!chapterId

  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  // Load existing entry when editing
  useEffect(() => {
    if (!chapterId) return
    setIsLoadingEntry(true)
    setEditingChapterId(chapterId)

    const supabase = createClient()
    supabase
      .from('chapters')
      .select('raw_entry, entry_date')
      .eq('id', chapterId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRawEntry(data.raw_entry)
          setEntryDate(data.entry_date)
        }
        setIsLoadingEntry(false)
      })
  }, [chapterId, setEditingChapterId, setRawEntry, setEntryDate])

  async function handleGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate,
          ...(isEditing && { chapterId }),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate chapter')
      }

      const { chapterId: resultChapterId } = await response.json()
      reset()
      router.push(`/novel/${novelId}/chapter/${resultChapterId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }

  if (isLoadingEntry) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[200px]">
        <p className="text-text-muted font-ui text-sm">Loading entry...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button onClick={() => { reset(); router.back() }} className="text-sm text-text-muted hover:text-text-secondary">
          &larr; Back
        </button>
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-auto text-sm"
        />
      </div>

      {isEditing && (
        <p className="text-xs text-accent-primary font-ui mb-3">Editing entry — changes will regenerate this chapter</p>
      )}

      <Card className="min-h-[250px] md:min-h-[400px]">
        <FreeformEditor />
      </Card>

      {error && <p className="text-sm text-status-error mt-4">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-end mt-4 md:mt-6 gap-2 md:gap-3">
        <Button variant="secondary" onClick={() => { reset(); router.back() }}>
          Discard
        </Button>
        <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!rawEntry.trim()}>
          {isGenerating
            ? (isEditing ? 'Regenerating...' : 'Generating Chapter...')
            : (isEditing ? 'Regenerate Chapter' : 'Generate Chapter')
          }
        </Button>
      </div>

      {isGenerating && <GeneratingAnimation />}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWriteStore } from '@/stores/write-store'
import { FreeformEditor } from '@/components/write/FreeformEditor'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function FreeformWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const router = useRouter()
  const { rawEntry, entryDate, setEntryDate, setSelectedNovelId, isGenerating, setIsGenerating, reset } = useWriteStore()
  const [error, setError] = useState('')

  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  async function handleGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, rawEntry, entryDate }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate chapter')
      }

      const { chapterId } = await response.json()
      reset()
      router.push(`/novel/${novelId}/chapter/${chapterId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button onClick={() => router.back()} className="text-sm text-text-muted hover:text-text-secondary">
          &larr; Back
        </button>
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-auto text-sm"
        />
      </div>

      <Card className="min-h-[400px]">
        <FreeformEditor />
      </Card>

      {error && <p className="text-sm text-status-error mt-4">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-end mt-4 md:mt-6 gap-2 md:gap-3">
        <Button variant="secondary" onClick={() => { reset(); router.back() }}>
          Discard
        </Button>
        <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!rawEntry.trim()}>
          {isGenerating ? 'Generating Chapter...' : 'Generate Chapter'}
        </Button>
      </div>

      {isGenerating && <GeneratingAnimation />}
    </div>
  )
}

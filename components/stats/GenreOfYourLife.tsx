'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface GenreOfYourLifeProps {
  novelId?: string
}

export function GenreOfYourLife({ novelId }: GenreOfYourLifeProps) {
  const [genre, setGenre] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const analyze = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analyze-genre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId }),
      })
      const data = await res.json()
      setGenre(data.genre)
      setExplanation(data.explanation)
    } catch {
      setGenre('Literary Fiction')
      setExplanation('Your life reads like a thoughtful literary work.')
    }
    setLoading(false)
  }, [novelId])

  useEffect(() => { analyze() }, [analyze])

  return (
    <Card variant="glass">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base md:text-lg text-text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-primary/60" />
          Genre of Your Life
        </h3>
        <Button variant="ghost" size="sm" onClick={analyze} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '' : 'Refresh'}
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-text-muted py-4 text-center">Analyzing your story...</p>
      ) : (
        <>
          <p className="font-display text-xl md:text-2xl text-gradient mb-2">{genre}</p>
          <p className="text-sm text-text-secondary font-body leading-relaxed">{explanation}</p>
        </>
      )}
    </Card>
  )
}

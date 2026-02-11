'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import type { Chapter } from '@/types'

const MOODS = ['joyful', 'excited', 'peaceful', 'reflective', 'anxious', 'melancholic', 'angry', 'confused']

export default function ChapterSearchPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const [query, setQuery] = useState('')
  const [moodFilter, setMoodFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [results, setResults] = useState<Chapter[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load all tags for this novel
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chapters')
      .select('tags')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .then(({ data }) => {
        const tags = new Set<string>()
        data?.forEach(c => c.tags?.forEach((t: string) => tags.add(t)))
        setAllTags(Array.from(tags).sort())
      })
  }, [novelId])

  const search = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .order('chapter_number', { ascending: false })

    if (query.trim()) {
      q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    }
    if (moodFilter) {
      q = q.eq('mood', moodFilter)
    }
    if (tagFilter) {
      q = q.contains('tags', [tagFilter])
    }
    if (dateFrom) {
      q = q.gte('entry_date', dateFrom)
    }
    if (dateTo) {
      q = q.lte('entry_date', dateTo)
    }

    const { data } = await q
    setResults(data || [])
    setLoading(false)
  }, [novelId, query, moodFilter, tagFilter, dateFrom, dateTo])

  useEffect(() => {
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-block">
        &larr; Back to Novel
      </Link>
      <h1 className="font-display text-xl md:text-2xl text-text-primary mb-4">Search Chapters</h1>

      <div className="space-y-3 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapter text or titles..."
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={moodFilter}
            onChange={(e) => setMoodFilter(e.target.value)}
            className="bg-ink-surface border border-ink-border rounded-lg px-3 py-1.5 text-xs font-ui text-text-secondary"
          >
            <option value="">All moods</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto text-xs"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto text-xs"
            placeholder="To"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTagFilter('')}
              className={`px-2 py-0.5 rounded-full text-xs font-ui transition-colors ${
                !tagFilter ? 'bg-ink-highlight text-accent-primary' : 'bg-ink-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`px-2 py-0.5 rounded-full text-xs font-ui transition-colors ${
                  tagFilter === tag ? 'bg-ink-highlight text-accent-primary' : 'bg-ink-surface text-text-muted hover:text-text-secondary'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted text-center py-8">Searching...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No chapters found.</p>
          <p className="text-text-muted text-sm mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-ui mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(chapter => (
            <Link
              key={chapter.id}
              href={`/novel/${novelId}/chapter/${chapter.id}`}
              className="block"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border border-ink-border bg-ink-card hover:border-accent-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-text-primary truncate">
                    {chapter.title || `Chapter ${chapter.chapter_number}`}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(chapter.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {query && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {chapter.content.substring(0, 150)}...
                    </p>
                  )}
                </div>
                {chapter.mood && (
                  <span className="px-2 py-0.5 rounded-full bg-ink-surface text-xs text-text-muted flex-shrink-0">
                    {chapter.mood}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

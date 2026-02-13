# Phase 3: Magic Features — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 4 magic features — Quote Wall, Alternate Universe chapters, Tarot Character Cards, and Dynamic AI Covers.

**Architecture:** All features follow existing patterns: server components for pages, client components for interactivity, API routes for AI calls, Supabase for persistence. New tables via migration. Image generation via NVIDIA Picasso API. Covers stored in Supabase Storage.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, NVIDIA API (Kimi K2.5 for text, Picasso SDXL for images), Framer Motion, Zustand

---

## Task 1: Database Migration — All Phase 3 Tables

**Files:**
- Create: `supabase/migrations/005_phase3_magic_features.sql`
- Modify: `types/index.ts`

**Step 1: Create the migration file**

Create `supabase/migrations/005_phase3_magic_features.sql`:

```sql
-- ============================================
-- PHASE 3: MAGIC FEATURES
-- ============================================

-- Quote Wall: saved quotes
CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_saved_quotes_novel ON saved_quotes(novel_id);
ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved quotes" ON saved_quotes
  FOR ALL USING (auth.uid() = user_id);

-- Alternate Universe: reimagined chapters
CREATE TABLE alternate_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  genre TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  opening_quote TEXT,
  mood TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_alternate_chapters_chapter ON alternate_chapters(chapter_id);
ALTER TABLE alternate_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alternate chapters" ON alternate_chapters
  FOR ALL USING (
    chapter_id IN (
      SELECT c.id FROM chapters c
      JOIN novels n ON c.novel_id = n.id
      WHERE n.user_id = auth.uid()
    )
  );

-- Tarot Character Cards: extend story_profiles
ALTER TABLE story_profiles ADD COLUMN IF NOT EXISTS archetype TEXT;
ALTER TABLE story_profiles ADD COLUMN IF NOT EXISTS portrait_url TEXT;
ALTER TABLE story_profiles ADD COLUMN IF NOT EXISTS first_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE story_profiles ADD COLUMN IF NOT EXISTS mention_count INTEGER DEFAULT 0;
```

**Step 2: Add TypeScript types**

Add to `types/index.ts` before the final `NovelWithChapterCount` interface:

```typescript
export interface SavedQuote {
  id: string
  user_id: string
  chapter_id: string
  novel_id: string
  text: string
  created_at: string
}

export type AlternateGenre = 'medieval' | 'space-opera' | 'noir' | 'cyberpunk' | 'romcom' | 'horror' | 'superhero'

export interface AlternateChapter {
  id: string
  chapter_id: string
  genre: AlternateGenre
  title: string | null
  content: string
  opening_quote: string | null
  mood: string | null
  word_count: number
  created_at: string
}
```

Also update the `StoryProfile` interface to include the new columns:

```typescript
// Add these fields to the existing StoryProfile interface:
  archetype: string | null
  portrait_url: string | null
  first_chapter_id: string | null
  mention_count: number
```

**Step 3: Commit**

```bash
git add supabase/migrations/005_phase3_magic_features.sql types/index.ts
git commit -m "feat: Phase 3 database migration — saved_quotes, alternate_chapters, profile extensions"
```

---

## Task 2: Quote Wall — Page & QuoteCard Component

**Files:**
- Create: `app/(dashboard)/novel/[novelId]/quotes/page.tsx`
- Create: `components/novel/QuoteCard.tsx`
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx:59-78` (add Quotes nav button)

**Step 1: Create QuoteCard component**

Create `components/novel/QuoteCard.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'

interface QuoteCardProps {
  quote: string
  chapterTitle: string | null
  chapterNumber: number
  chapterId: string
  novelId: string
  mood: string | null
  entryDate: string
  isSaved?: boolean
  index?: number
}

export function QuoteCard({ quote, chapterTitle, chapterNumber, chapterId, novelId, mood, entryDate, isSaved, index = 0 }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/novel/${novelId}/chapter/${chapterId}`}>
        <div className="p-4 md:p-5 rounded-xl glass-card hover:border-accent-primary/30 hover:shadow-glow-sm transition-all duration-300 break-inside-avoid mb-3 group">
          <blockquote className="font-body text-sm md:text-base text-text-primary/90 leading-relaxed italic mb-3">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-ui text-text-muted">
                Ch. {chapterNumber}{chapterTitle ? ` — ${chapterTitle}` : ''}
              </p>
              <p className="text-[10px] text-text-muted/60 mt-0.5">
                {new Date(entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mood && (
                <span className="px-2 py-0.5 rounded-full bg-ink-surface/80 text-[10px] text-text-muted">{mood}</span>
              )}
              {isSaved && <Bookmark className="w-3 h-3 text-accent-primary fill-accent-primary" />}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
```

**Step 2: Create quotes page**

Create `app/(dashboard)/novel/[novelId]/quotes/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { QuoteCard } from '@/components/novel/QuoteCard'

export default async function QuotesPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  const [novelResult, chaptersResult, savedResult] = await Promise.all([
    supabase.from('novels').select('title').eq('id', novelId).single(),
    supabase
      .from('chapters')
      .select('id, chapter_number, title, opening_quote, mood, entry_date')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .not('opening_quote', 'is', null)
      .order('chapter_number', { ascending: false }),
    supabase
      .from('saved_quotes')
      .select('id, chapter_id, text, created_at')
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false }),
  ])

  if (!novelResult.data) notFound()

  const chapters = chaptersResult.data || []
  const savedQuotes = savedResult.data || []
  const savedChapterIds = new Set(savedQuotes.map(q => q.chapter_id))

  // Combine: opening quotes from chapters + user-saved quotes
  const allQuotes = [
    ...chapters.map(ch => ({
      text: ch.opening_quote!,
      chapterTitle: ch.title,
      chapterNumber: ch.chapter_number,
      chapterId: ch.id,
      mood: ch.mood,
      entryDate: ch.entry_date,
      isSaved: savedChapterIds.has(ch.id),
      source: 'opening' as const,
    })),
    ...savedQuotes.map(sq => {
      const ch = chapters.find(c => c.id === sq.chapter_id)
      return {
        text: sq.text,
        chapterTitle: ch?.title || null,
        chapterNumber: ch?.chapter_number || 0,
        chapterId: sq.chapter_id,
        mood: ch?.mood || null,
        entryDate: ch?.entry_date || sq.created_at,
        isSaved: true,
        source: 'saved' as const,
      }
    }),
  ]

  // Deduplicate: if a saved quote matches an opening quote for same chapter, keep just one
  const seen = new Set<string>()
  const uniqueQuotes = allQuotes.filter(q => {
    const key = `${q.chapterId}:${q.text.slice(0, 50)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </Link>
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1">Quote Wall</h1>
      <p className="text-sm text-text-muted mb-6">{uniqueQuotes.length} quote{uniqueQuotes.length !== 1 ? 's' : ''} from {novelResult.data.title}</p>

      {uniqueQuotes.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-lg text-text-secondary mb-2">No quotes yet</p>
          <p className="text-sm text-text-muted">Write your first chapter to see its opening quote here.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-3">
          {uniqueQuotes.map((quote, i) => (
            <QuoteCard
              key={`${quote.chapterId}-${quote.source}-${i}`}
              quote={quote.text}
              chapterTitle={quote.chapterTitle}
              chapterNumber={quote.chapterNumber}
              chapterId={quote.chapterId}
              novelId={novelId}
              mood={quote.mood}
              entryDate={quote.entryDate}
              isSaved={quote.isSaved}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Add Quotes nav button to novel detail page**

In `app/(dashboard)/novel/[novelId]/page.tsx`, add a Quotes button inside the `<div className="flex gap-2 md:gap-3 mb-6 md:mb-8 flex-wrap">` section, after the Stats button (around line 77):

```tsx
        <Link href={`/novel/${novelId}/quotes`}>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            Quotes
          </Button>
        </Link>
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with the new `/novel/[novelId]/quotes` route.

**Step 5: Commit**

```bash
git add app/(dashboard)/novel/[novelId]/quotes/page.tsx components/novel/QuoteCard.tsx app/(dashboard)/novel/[novelId]/page.tsx
git commit -m "feat: quote wall page with masonry grid and opening quotes"
```

---

## Task 3: Quote Wall — Save Quote from Chapter Reader

**Files:**
- Create: `components/novel/SaveQuoteButton.tsx`
- Modify: `components/novel/ChapterReader.tsx` (add text selection handler + save button)

**Step 1: Create SaveQuoteButton component**

Create `components/novel/SaveQuoteButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SaveQuoteButtonProps {
  text: string
  chapterId: string
  novelId: string
  onSaved: () => void
}

export function SaveQuoteButton({ text, chapterId, novelId, onSaved }: SaveQuoteButtonProps) {
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('saved_quotes').insert({
      user_id: user.id,
      chapter_id: chapterId,
      novel_id: novelId,
      text: text.trim(),
    })

    setIsSaving(false)
    onSaved()
  }

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-card border border-accent-primary/30 text-xs font-ui text-accent-primary hover:bg-ink-highlight transition-all shadow-lg"
    >
      <Bookmark className="w-3.5 h-3.5" />
      {isSaving ? 'Saving...' : 'Save Quote'}
    </button>
  )
}
```

**Step 2: Add text selection handler to ChapterReader**

Convert `ChapterReader` to a client component and add selection detection. Modify `components/novel/ChapterReader.tsx`:

The component needs to become `'use client'` and wrap the prose section in a div with an `onMouseUp`/`onTouchEnd` handler that detects selected text and shows the `SaveQuoteButton` as a floating popover near the selection.

Add these imports at the top:
```tsx
'use client'

import { useState, useCallback } from 'react'
```

Add `SaveQuoteButton` import:
```tsx
import { SaveQuoteButton } from './SaveQuoteButton'
```

Add state and handler inside the component:
```tsx
const [selectedText, setSelectedText] = useState('')
const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null)

const handleTextSelect = useCallback(() => {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (text && text.length > 10 && text.length < 500) {
    const range = selection!.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setSelectedText(text)
    setSelectionPos({ top: rect.top + window.scrollY - 40, left: rect.left + rect.width / 2 })
  } else {
    setSelectedText('')
    setSelectionPos(null)
  }
}, [])
```

Wrap the prose `<div>` with `onMouseUp={handleTextSelect}`:
```tsx
<div className="prose-reading space-y-5 md:space-y-7" onMouseUp={handleTextSelect}>
```

Add the floating save button after the prose div, before `</article>`:
```tsx
{selectedText && selectionPos && (
  <div
    className="fixed z-50"
    style={{ top: `${selectionPos.top}px`, left: `${selectionPos.left}px`, transform: 'translateX(-50%)' }}
  >
    <SaveQuoteButton
      text={selectedText}
      chapterId={chapter.id}
      novelId={novelId}
      onSaved={() => { setSelectedText(''); setSelectionPos(null) }}
    />
  </div>
)}
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add components/novel/SaveQuoteButton.tsx components/novel/ChapterReader.tsx
git commit -m "feat: save quote from text selection in chapter reader"
```

---

## Task 4: Alternate Universe — Prompt Builder & API Route

**Files:**
- Create: `lib/ai/alternate-prompts.ts`
- Create: `app/api/generate-alternate/route.ts`

**Step 1: Create genre-specific prompt builders**

Create `lib/ai/alternate-prompts.ts`:

```typescript
import type { Novel, StoryProfile } from '@/types'

export const AU_GENRES = [
  { value: 'medieval', label: 'Medieval Fantasy', icon: '🏰', description: 'Knights, castles, and ancient magic' },
  { value: 'space-opera', label: 'Space Opera', icon: '🚀', description: 'Galactic empires and starships' },
  { value: 'noir', label: 'Film Noir', icon: '🕵️', description: 'Dark alleys, shadows, and mystery' },
  { value: 'cyberpunk', label: 'Cyberpunk', icon: '🤖', description: 'Neon-lit dystopian future' },
  { value: 'romcom', label: 'Romantic Comedy', icon: '💕', description: 'Light-hearted and charming' },
  { value: 'horror', label: 'Horror', icon: '👻', description: 'Psychological dread and suspense' },
  { value: 'superhero', label: 'Superhero', icon: '⚡', description: 'Powers, villains, and destiny' },
] as const

const GENRE_PROMPTS: Record<string, string> = {
  medieval: `Rewrite this day as if it took place in a medieval fantasy kingdom. Transform modern settings into castles, taverns, and enchanted forests. Modern jobs become guild roles or court positions. Technology becomes magic. Keep ALL real events, emotions, and relationships intact — only transform the setting and language.`,
  'space-opera': `Rewrite this day as if it happened aboard a massive starship or on an alien world. Transform earthly locations into space stations, planetary colonies, or ship decks. Modern roles become space fleet positions. Keep ALL real events, emotions, and relationships intact — only transform the setting to deep space.`,
  noir: `Rewrite this day in the style of a 1940s film noir detective story. The protagonist narrates in hardboiled first-person. Rain-soaked streets, shadowy figures, double meanings. Every interaction drips with tension and subtext. Keep ALL real events, emotions, and relationships intact — only transform the atmosphere and prose style.`,
  cyberpunk: `Rewrite this day as if it took place in a neon-drenched cyberpunk megacity. Augmented reality overlays, corporate towers, underground hackers. Modern tech becomes bleeding-edge implants and neural interfaces. Keep ALL real events, emotions, and relationships intact — only transform the setting to a dystopian future.`,
  romcom: `Rewrite this day as a romantic comedy screenplay. Charming inner monologue, comedic misunderstandings, meet-cute moments, witty banter. Everything gets a warm, funny, slightly exaggerated spin. Keep ALL real events, emotions, and relationships intact — amplify the humor and heart.`,
  horror: `Rewrite this day as psychological horror. Ordinary moments become deeply unsettling. Shadows linger too long. Small details feel wrong. Build slow creeping dread through atmosphere, not gore. Keep ALL real events, emotions, and relationships intact — transform the tone to suspenseful horror.`,
  superhero: `Rewrite this day as a superhero origin story. The protagonist discovers or uses extraordinary abilities. Daily challenges become epic confrontations. Mundane settings become arenas. Keep ALL real events, emotions, and relationships intact — transform the scale and stakes to superheroic.`,
}

export function buildAlternatePrompt(
  genre: string,
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  storyProfiles: StoryProfile[] = []
): { system: string; user: string } {
  const genreInstruction = GENRE_PROMPTS[genre] || GENRE_PROMPTS.medieval

  // Build profile context (same as regular generation)
  let profileContext = ''
  const characters = storyProfiles.filter(p => p.type === 'character')
  const locations = storyProfiles.filter(p => p.type === 'location')

  if (storyProfiles.length > 0) {
    profileContext = '\nCHARACTER REFERENCE (use these names, never invent new ones):\n'
    characters.forEach(p => {
      profileContext += `- ${p.name}${p.relationship ? ` (${p.relationship})` : ''}${p.nickname ? ` aka "${p.nickname}"` : ''}\n`
    })
    if (locations.length > 0) {
      profileContext += 'LOCATIONS:\n'
      locations.forEach(p => { profileContext += `- ${p.name}\n` })
    }
  }

  const system = `You are a masterful novelist who reimagines real daily experiences in alternate genres.

ORIGINAL NOVEL CONTEXT:
- Title: "${novel.title}"
- Protagonist: "${novel.character_name}"
- Original genre: ${novel.genre}

ALTERNATE UNIVERSE GENRE INSTRUCTIONS:
${genreInstruction}
${profileContext}
STRICT RULES:
- Keep ALL real events, people, and emotional beats from the original entry
- Transform ONLY the setting, language, metaphors, and atmosphere
- Use character names from the reference — NEVER invent names
- Maintain the same emotional arc and relationships
- Chapter length: 500-1500 words

RESPOND IN JSON ONLY (no markdown code fences):
{
  "title": "Chapter title in the alternate genre style",
  "opening_quote": "A thematic quote matching the alternate genre",
  "content": "Full reimagined chapter text...",
  "mood": "reflective|joyful|anxious|melancholic|excited|angry|peaceful|confused"
}`

  const user = `Here is what happened on ${entryDate}:\n\n${rawEntry}`

  return { system, user }
}
```

**Step 2: Create the API route**

Create `app/api/generate-alternate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildAlternatePrompt } from '@/lib/ai/alternate-prompts'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed } = checkRateLimit(`alternate:${user.id}`, 5, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { chapterId, genre } = await request.json()

    if (!chapterId || !genre) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch original chapter
    const { data: chapter } = await supabase
      .from('chapters')
      .select('novel_id, raw_entry, entry_date')
      .eq('id', chapterId)
      .single()

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Fetch novel and profiles in parallel
    const [novelResult, profilesResult] = await Promise.all([
      supabase.from('novels').select('*').eq('id', chapter.novel_id).single(),
      supabase.from('story_profiles').select('*').eq('user_id', user.id),
    ])

    if (!novelResult.data) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const { system, user: userPrompt } = buildAlternatePrompt(
      genre, novelResult.data, chapter.raw_entry, chapter.entry_date, profilesResult.data || []
    )

    // Call NVIDIA API
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 1.0,
        stream: false,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`NVIDIA API error (${response.status}):`, err)
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 })
    }

    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content || ''
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid response. Please try again.' }, { status: 502 })
    }

    // Save alternate chapter
    const { data: altChapter, error: insertError } = await supabase
      .from('alternate_chapters')
      .insert({
        chapter_id: chapterId,
        genre,
        title: parsed.title,
        content: parsed.content,
        opening_quote: parsed.opening_quote,
        mood: parsed.mood,
        word_count: parsed.content?.split(/\s+/).length || 0,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ alternateChapterId: altChapter.id })
  } catch (error) {
    console.error('Alternate generation error:', error)
    return NextResponse.json({ error: 'Failed to generate alternate chapter' }, { status: 500 })
  }
}
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add lib/ai/alternate-prompts.ts app/api/generate-alternate/route.ts
git commit -m "feat: alternate universe API with 7 genre-specific prompt builders"
```

---

## Task 5: Alternate Universe — Genre Picker Modal & Chapter Reader Tabs

**Files:**
- Create: `components/novel/GenrePickerModal.tsx`
- Create: `components/novel/AlternateChapterView.tsx`
- Modify: `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx` (fetch alternates, add tabs)

**Step 1: Create GenrePickerModal**

Create `components/novel/GenrePickerModal.tsx`:

```tsx
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
```

**Step 2: Create AlternateChapterView component**

Create `components/novel/AlternateChapterView.tsx`:

```tsx
import { Hash } from 'lucide-react'
import type { AlternateChapter } from '@/types'
import { AU_GENRES } from '@/lib/ai/alternate-prompts'

export function AlternateChapterView({ alt }: { alt: AlternateChapter }) {
  const genreInfo = AU_GENRES.find(g => g.value === alt.genre)
  const paragraphs = alt.content.split('\n').filter(p => p.trim())

  return (
    <article className="max-w-2xl mx-auto">
      <header className="text-center mb-8 md:mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-highlight text-xs font-ui text-accent-primary mb-3">
          {genreInfo?.icon} {genreInfo?.label || alt.genre}
        </span>
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-text-primary mb-6">
          {alt.title || 'Alternate Chapter'}
        </h1>
        {alt.opening_quote && (
          <blockquote className="relative font-body italic text-text-secondary text-base md:text-lg mx-auto max-w-md text-left px-6">
            <span className="absolute left-0 top-0 font-display text-3xl text-accent-primary/40 leading-none">&ldquo;</span>
            <span className="relative z-10">{alt.opening_quote}</span>
            <span className="font-display text-3xl text-accent-primary/40 leading-none">&rdquo;</span>
          </blockquote>
        )}
      </header>

      <div className="flex items-center justify-center gap-3 mb-8 md:mb-12">
        <div className="w-8 border-t border-ink-border/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/30" />
        <div className="w-8 border-t border-ink-border/50" />
      </div>

      <div className="prose-reading space-y-5 md:space-y-7">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="font-body text-base md:text-lg text-text-primary/90 leading-[1.8] md:leading-[1.9] tracking-normal md:tracking-wide first-letter:text-2xl first-letter:font-display first-letter:text-accent-primary/80 first-letter:mr-0.5">
            {paragraph}
          </p>
        ))}
      </div>

      <footer className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-ink-border/50">
        <div className="flex items-center justify-between text-xs text-text-muted">
          {alt.mood && (
            <span className="px-3 py-1 rounded-full glass-card flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              {alt.mood}
            </span>
          )}
          <span>{alt.word_count} words</span>
        </div>
      </footer>
    </article>
  )
}
```

**Step 3: Update chapter page to fetch alternates and show tabs**

Modify `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx`. This is a major update — the page becomes a client/server hybrid. The server component fetches the chapter + alternates, and a new client wrapper handles tab switching and the reimagine button.

Create a client wrapper component `components/novel/ChapterPageClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [alternates, setAlternates] = useState(initialAlternates)
  const router = useRouter()

  async function handleGenreSelect(genre: string) {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-alternate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id, genre }),
      })
      if (!response.ok) throw new Error('Failed')
      setShowGenrePicker(false)
      router.refresh()
      // Fetch the updated alternates
      const refreshResponse = await fetch(`/api/generate-alternate?chapterId=${chapter.id}`)
      // Just refresh the page to get server data
      window.location.reload()
    } catch {
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
```

Then update the chapter page (`app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx`) to fetch alternates and use the client wrapper:

Replace the `<ChapterReader>` call with `<ChapterPageClient>` and add the alternates fetch:

```tsx
// Add to imports:
import { ChapterPageClient } from '@/components/novel/ChapterPageClient'
import type { AlternateChapter } from '@/types'

// After fetching the chapter and before the return, add:
let alternates: AlternateChapter[] = []
try {
  const { data } = await supabase
    .from('alternate_chapters')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true })
  alternates = data || []
} catch {
  // Non-critical
}

// In the JSX, replace:
//   <ChapterReader chapter={chapter} novelId={novelId} />
// with:
//   <ChapterPageClient chapter={chapter} novelId={novelId} alternates={alternates} />
```

Remove the old `ChapterReader` import since it's now used inside `ChapterPageClient`.

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add components/novel/GenrePickerModal.tsx components/novel/AlternateChapterView.tsx components/novel/ChapterPageClient.tsx app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx
git commit -m "feat: alternate universe — genre picker, tabs, and reimagined chapter view"
```

---

## Task 6: Tarot Character Cards — TarotCard Component

**Files:**
- Create: `components/novel/TarotCard.tsx`

**Step 1: Create the flip card component**

Create `components/novel/TarotCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import type { StoryProfile } from '@/types'

const archetypeColors: Record<string, string> = {
  'The Anchor': 'from-blue-900/40 to-cyan-900/20',
  'The Catalyst': 'from-orange-900/40 to-red-900/20',
  'The Rival': 'from-red-900/40 to-rose-900/20',
  'The Mirror': 'from-purple-900/40 to-violet-900/20',
  'The Sage': 'from-emerald-900/40 to-teal-900/20',
  'The Storm': 'from-slate-800/40 to-zinc-900/20',
  'The Light': 'from-amber-900/40 to-yellow-900/20',
}

interface TarotCardProps {
  profile: StoryProfile
  novelId: string
  index?: number
}

export function TarotCard({ profile, novelId, index = 0 }: TarotCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const gradient = archetypeColors[profile.archetype || ''] || 'from-ink-surface to-ink-card'
  const details = Object.entries(profile.details || {}).filter(([, v]) => v)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="relative w-full aspect-[2/3] preserve-3d"
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border border-ink-border/50">
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6`}>
            {/* Portrait or Initial */}
            {profile.portrait_url ? (
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-accent-primary/30 mb-4">
                <Image src={profile.portrait_url} alt={profile.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-ink-card/50 border-2 border-accent-primary/20 flex items-center justify-center mb-4">
                <span className="font-display text-4xl md:text-5xl text-accent-primary/70">{profile.name.charAt(0)}</span>
              </div>
            )}

            <h3 className="font-display text-lg md:text-xl text-text-primary text-center">{profile.name}</h3>
            {profile.archetype && (
              <p className="text-xs font-ui text-accent-primary tracking-widest uppercase mt-1">{profile.archetype}</p>
            )}
            {profile.relationship && (
              <p className="text-xs text-text-muted mt-1">{profile.relationship}</p>
            )}
            {(profile.mention_count ?? 0) > 0 && (
              <p className="text-[10px] text-text-muted/60 mt-2">{profile.mention_count} mentions</p>
            )}

            {/* Tarot border decoration */}
            <div className="absolute inset-3 border border-accent-primary/10 rounded-xl pointer-events-none" />
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden border border-ink-border/50 bg-ink-card">
          <div className="w-full h-full p-5 flex flex-col overflow-y-auto">
            <h3 className="font-display text-lg text-text-primary mb-1">{profile.name}</h3>
            {profile.nickname && (
              <p className="text-xs text-text-muted mb-3">&ldquo;{profile.nickname}&rdquo;</p>
            )}

            {details.length > 0 && (
              <div className="space-y-2 mb-4">
                {details.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{key}</p>
                    <p className="text-sm text-text-secondary">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {profile.first_chapter_id && (
              <Link
                href={`/novel/${novelId}/chapter/${profile.first_chapter_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-accent-primary hover:text-accent-primary/80 mt-auto"
              >
                First appearance →
              </Link>
            )}

            <p className="text-[10px] text-text-muted/50 mt-3 text-center">Tap to flip</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

**Step 2: Add CSS for 3D transforms**

Add to `app/globals.css` (within the existing file, in the utilities layer):

```css
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
```

**Step 3: Commit**

```bash
git add components/novel/TarotCard.tsx app/globals.css
git commit -m "feat: tarot character card component with flip animation"
```

---

## Task 7: Tarot Character Cards — Characters Page

**Files:**
- Create: `app/(dashboard)/novel/[novelId]/characters/page.tsx`
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx` (add Characters nav button)

**Step 1: Create characters page**

Create `app/(dashboard)/novel/[novelId]/characters/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TarotCard } from '@/components/novel/TarotCard'
import type { StoryProfile } from '@/types'

export default async function CharactersPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [novelResult, profilesResult] = await Promise.all([
    supabase.from('novels').select('title').eq('id', novelId).single(),
    supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('mention_count', { ascending: false }),
  ])

  if (!novelResult.data) notFound()

  const profiles: StoryProfile[] = profilesResult.data || []
  const characters = profiles.filter(p => p.type === 'character')
  const locations = profiles.filter(p => p.type === 'location')
  const personal = profiles.filter(p => p.type === 'personal')

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </Link>
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1">Characters</h1>
      <p className="text-sm text-text-muted mb-6">{profiles.length} profile{profiles.length !== 1 ? 's' : ''} in {novelResult.data.title}</p>

      {profiles.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-lg text-text-secondary mb-2">No characters yet</p>
          <p className="text-sm text-text-muted">Add characters in <Link href="/settings" className="text-accent-primary hover:text-accent-primary/80">Settings → Story Profiles</Link> to see them here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {personal.length > 0 && (
            <section>
              <h2 className="font-display text-base text-text-secondary mb-3">Protagonist</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {personal.map((p, i) => <TarotCard key={p.id} profile={p} novelId={novelId} index={i} />)}
              </div>
            </section>
          )}

          {characters.length > 0 && (
            <section>
              <h2 className="font-display text-base text-text-secondary mb-3">Characters</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {characters.map((p, i) => <TarotCard key={p.id} profile={p} novelId={novelId} index={i} />)}
              </div>
            </section>
          )}

          {locations.length > 0 && (
            <section>
              <h2 className="font-display text-base text-text-secondary mb-3">Locations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {locations.map((p, i) => <TarotCard key={p.id} profile={p} novelId={novelId} index={i} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add Characters nav button to novel detail page**

In `app/(dashboard)/novel/[novelId]/page.tsx`, add a Characters button in the nav section (after Quotes button):

```tsx
        <Link href={`/novel/${novelId}/characters`}>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Characters
          </Button>
        </Link>
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add app/(dashboard)/novel/[novelId]/characters/page.tsx app/(dashboard)/novel/[novelId]/page.tsx
git commit -m "feat: tarot character cards page with grid layout and nav button"
```

---

## Task 8: Dynamic Covers — Cover Prompt Builder & API Route

**Files:**
- Create: `lib/ai/cover-prompts.ts`
- Create: `app/api/generate-cover/route.ts`
- Modify: `next.config.mjs` (add Supabase image domain)

**Step 1: Create cover prompt builder**

Create `lib/ai/cover-prompts.ts`:

```typescript
import type { Novel } from '@/types'

const GENRE_STYLES: Record<string, string> = {
  literary: 'minimalist, muted earth tones, single symbolic object, soft lighting, book cover art',
  romance: 'warm golden light, soft focus, intimate scene, gentle sunset colors, dreamy atmosphere',
  thriller: 'dark shadows, high contrast, urban landscape at night, moody blue and orange tones',
  fantasy: 'sweeping landscape, magical elements, rich saturated colors, ethereal lighting',
  scifi: 'futuristic cityscape, neon accents, space elements, clean geometric shapes',
  comedy: 'bright playful colors, whimsical illustration style, cheerful and energetic',
  poetic: 'abstract watercolor texture, flowing forms, soft pastels with gold accents',
  noir: 'black and white with single gold accent color, silhouette figures, rain-soaked city',
}

export function buildCoverImagePrompt(
  novel: Novel,
  topMoods: string[],
  topTags: string[]
): string {
  const genreStyle = GENRE_STYLES[novel.genre] || GENRE_STYLES.literary
  const moodContext = topMoods.length > 0 ? `Emotional tone: ${topMoods.join(', ')}.` : ''
  const themeContext = topTags.length > 0 ? `Themes: ${topTags.join(', ')}.` : ''

  return `Book cover art for a novel titled "${novel.title}". ${genreStyle}. ${moodContext} ${themeContext} Professional publishing quality, no text or letters on the image, cinematic composition, atmospheric depth. Dark background compatible with gold overlay text.`
}
```

**Step 2: Create generate-cover API route**

Create `app/api/generate-cover/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCoverImagePrompt } from '@/lib/ai/cover-prompts'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed } = checkRateLimit(`cover:${user.id}`, 3, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const { novelId } = await request.json()
    if (!novelId) {
      return NextResponse.json({ error: 'Missing novelId' }, { status: 400 })
    }

    // Fetch novel and recent chapter data
    const [novelResult, chaptersResult] = await Promise.all([
      supabase.from('novels').select('*').eq('id', novelId).single(),
      supabase
        .from('chapters')
        .select('mood, tags')
        .eq('novel_id', novelId)
        .is('deleted_at', null)
        .order('chapter_number', { ascending: false })
        .limit(10),
    ])

    if (!novelResult.data) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const novel = novelResult.data
    const chapters = chaptersResult.data || []

    // Extract top moods and tags
    const moodCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    for (const ch of chapters) {
      if (ch.mood) moodCounts[ch.mood] = (moodCounts[ch.mood] || 0) + 1
      for (const tag of (ch.tags || [])) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }
    const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m)
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)

    const imagePrompt = buildCoverImagePrompt(novel, topMoods, topTags)

    // Call NVIDIA Picasso API (Stable Diffusion XL)
    const imageResponse = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          { text: imagePrompt, weight: 1 },
          { text: 'text, letters, words, watermark, ugly, blurry, deformed', weight: -1 },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      }),
    })

    if (!imageResponse.ok) {
      const err = await imageResponse.text()
      console.error(`NVIDIA Image API error (${imageResponse.status}):`, err)
      return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 502 })
    }

    const imageData = await imageResponse.json()
    const base64Image = imageData.artifacts?.[0]?.base64

    if (!base64Image) {
      return NextResponse.json({ error: 'No image generated' }, { status: 502 })
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(base64Image, 'base64')
    const fileName = `covers/${user.id}/${novelId}/${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to save cover image' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    // Update novel with cover URL
    await supabase
      .from('novels')
      .update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', novelId)

    return NextResponse.json({ coverUrl: publicUrl })
  } catch (error) {
    console.error('Cover generation error:', error)
    return NextResponse.json({ error: 'Failed to generate cover' }, { status: 500 })
  }
}
```

**Step 3: Update next.config.mjs for Supabase image domain**

Update `next.config.mjs` to allow Supabase Storage images:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add lib/ai/cover-prompts.ts app/api/generate-cover/route.ts next.config.mjs
git commit -m "feat: dynamic cover generation API with NVIDIA Picasso + Supabase Storage"
```

---

## Task 9: Dynamic Covers — UI (Settings Button + Novel Detail Hero)

**Files:**
- Modify: `app/(dashboard)/novel/[novelId]/settings/page.tsx` (add Generate Cover button)
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx` (add cover hero)

**Step 1: Add Generate Cover button to novel settings**

In `app/(dashboard)/novel/[novelId]/settings/page.tsx`, add a new Card section after the Writing Style card and before the Save button (around line 161).

Add state at the top of the component:
```typescript
const [isGeneratingCover, setIsGeneratingCover] = useState(false)
const [coverUrl, setCoverUrl] = useState<string | null>(null)
```

In the `useEffect` that loads the novel, also set `setCoverUrl(data.cover_image_url)`.

Add the Cover card JSX:

```tsx
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card variant="glass">
            <h2 className="font-display text-lg text-text-primary mb-4">Book Cover</h2>
            {coverUrl && (
              <div className="relative aspect-square w-32 rounded-lg overflow-hidden border border-ink-border/50 mb-4">
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs text-text-muted mb-3">
              AI generates a cover based on your novel&apos;s genre, moods, and themes.
            </p>
            <Button
              size="sm"
              variant="outline"
              isLoading={isGeneratingCover}
              onClick={async () => {
                setIsGeneratingCover(true)
                try {
                  const res = await fetch('/api/generate-cover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ novelId: params.novelId }),
                  })
                  if (res.ok) {
                    const { coverUrl: url } = await res.json()
                    setCoverUrl(url)
                  }
                } catch {}
                setIsGeneratingCover(false)
              }}
            >
              {coverUrl ? 'Regenerate Cover' : 'Generate Cover'}
            </Button>
          </Card>
        </motion.div>
```

**Step 2: Add cover hero to novel detail page**

In `app/(dashboard)/novel/[novelId]/page.tsx`, add a cover hero above the title when a cover exists. After the Library back link and before the `<h1>`:

```tsx
        {novel.cover_image_url && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-ink-border/30 mb-4">
            <img src={novel.cover_image_url} alt={novel.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-bg via-ink-bg/60 to-transparent" />
          </div>
        )}
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add app/(dashboard)/novel/[novelId]/settings/page.tsx app/(dashboard)/novel/[novelId]/page.tsx
git commit -m "feat: generate cover button in settings + cover hero on novel detail"
```

---

## Task 10: Final Build Verification & Cleanup

**Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds. New routes should include:
- `/novel/[novelId]/quotes`
- `/novel/[novelId]/characters`
- `/api/generate-alternate`
- `/api/generate-cover`

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: Zero errors.

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "chore: Phase 3 magic features complete — quotes, AU, tarot cards, covers"
git push origin main
```

**Step 4: Manual testing checklist**

- [ ] Quote Wall: `/novel/{id}/quotes` shows opening quotes from chapters
- [ ] Quote Save: Selecting text in chapter reader shows "Save Quote" button
- [ ] Alternate Universe: "Reimagine This Day" button on chapter reader opens genre picker
- [ ] AU Generation: Selecting a genre generates an alternate chapter with tabs
- [ ] Tarot Cards: `/novel/{id}/characters` shows flip cards for story profiles
- [ ] Cover Gen: "Generate Cover" in novel settings calls NVIDIA Picasso API
- [ ] Cover Display: Generated cover shows on NovelCard and novel detail hero
- [ ] All nav buttons: Quotes + Characters accessible from novel detail page

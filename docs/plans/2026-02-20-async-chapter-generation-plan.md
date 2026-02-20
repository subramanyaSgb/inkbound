# Async Chapter Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make chapter generation non-blocking — insert a `generating` row immediately, process AI in background, let user navigate away after 30s, and show status-aware cards on the novel page.

**Architecture:** Two-endpoint pattern. `POST /api/generate-chapter` is restructured to insert the chapter row with `status: 'generating'` and return immediately. A new `POST /api/process-chapter` does the actual AI generation and updates the row. The client fires process-chapter with `keepalive: true` (fire-and-forget) and polls a new `GET /api/chapter-status` endpoint. After 30s with no completion, the user is redirected to the novel page where status-aware chapter cards show progress, retry, or failure states.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL), Zustand, Framer Motion, Tailwind CSS

**Design doc:** `docs/plans/2026-02-20-async-chapter-generation-design.md`

---

### Task 1: Database Migration — Add `status` Column

**Files:**
- Create: `supabase/migrations/007_chapter_status.sql`

**Step 1: Write the migration**

Create `supabase/migrations/007_chapter_status.sql`:

```sql
-- Add status column to chapters table for async generation tracking
-- Values: 'generating' (AI in progress), 'completed' (done), 'failed' (error)
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- All existing chapters are already complete
-- New chapters will be inserted with 'generating' and updated to 'completed'/'failed'

-- Index for efficient queries on novel page (find generating chapters)
CREATE INDEX IF NOT EXISTS idx_chapters_novel_status ON chapters(novel_id, status);
```

**Step 2: Run the migration**

Go to the Supabase SQL Editor for the project and execute the migration SQL.

**Step 3: Commit**

```bash
git add supabase/migrations/007_chapter_status.sql
git commit -m "db: add status column to chapters for async generation"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `types/index.ts` (lines 42-66 — `Chapter` interface)

**Step 1: Add ChapterStatus type and update Chapter interface**

In `types/index.ts`, add the `ChapterStatus` type after the `EntryMode` type (line 71):

```typescript
export type ChapterStatus = 'generating' | 'completed' | 'failed'
```

Update the `Chapter` interface — add `status` field and make `content` nullable (it's `NULL` while generating):

```typescript
export interface Chapter {
  id: string
  novel_id: string
  volume_id: string | null
  chapter_number: number
  title: string | null
  content: string | null        // ← Changed: nullable while generating
  raw_entry: string
  entry_mode: EntryMode
  entry_date: string
  status: ChapterStatus          // ← NEW
  mood: string | null
  mood_score: number | null
  tags: string[]
  opening_quote: string | null
  illustration_url: string | null
  soundtrack_suggestion: string | null
  is_bookmarked: boolean
  is_summary: boolean
  summary_type: string | null
  word_count: number
  version: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "types: add ChapterStatus, make content nullable for async gen"
```

---

### Task 3: Restructure `POST /api/generate-chapter` — Return Immediately

**Files:**
- Modify: `app/api/generate-chapter/route.ts`

This endpoint currently does everything: validate, insert/update chapter, call AI, save result. We restructure it to ONLY prepare the chapter row and return the chapterId. The actual AI generation moves to a separate endpoint (Task 4).

**Step 1: Rewrite the route**

Replace the entire contents of `app/api/generate-chapter/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 5 requests per minute per user
    const { allowed } = checkRateLimit(`generate:${user.id}`, 5, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { novelId, rawEntry, entryDate, chapterId, editInstruction } = await request.json()

    // Quick edit mode: editInstruction + chapterId, no rawEntry needed
    const isQuickEdit = !!editInstruction?.trim() && !!chapterId

    if (!novelId || (!isQuickEdit && (!rawEntry?.trim() || !entryDate))) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch novel
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // --- EDIT MODE: update existing chapter to 'generating' ---
    if (chapterId) {
      const { data: existingChapter } = await supabase
        .from('chapters')
        .select('chapter_number, raw_entry, entry_date')
        .eq('id', chapterId)
        .single()

      if (!existingChapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      }

      // Set status to generating, clear AI-generated content
      await supabase
        .from('chapters')
        .update({
          status: 'generating',
          raw_entry: isQuickEdit ? existingChapter.raw_entry : rawEntry,
          entry_date: isQuickEdit ? existingChapter.entry_date : entryDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId)

      return NextResponse.json({ chapterId, status: 'generating' })
    }

    // --- NEW CHAPTER: insert with 'generating' status ---

    // Get chapter count for chapter number (exclude deleted)
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId)
      .is('deleted_at', null)

    const chapterNumber = (chapterCount || 0) + 1

    // Get or create volume for the entry year
    const entryYear = new Date(entryDate).getFullYear()

    let { data: volume } = await supabase
      .from('volumes')
      .select('*')
      .eq('novel_id', novelId)
      .eq('year', entryYear)
      .single()

    if (!volume) {
      const { count: volumeCount } = await supabase
        .from('volumes')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId)

      const { data: newVolume } = await supabase
        .from('volumes')
        .insert({
          novel_id: novelId,
          year: entryYear,
          volume_number: (volumeCount || 0) + 1,
          title: `Volume ${(volumeCount || 0) + 1}`,
        })
        .select()
        .single()

      volume = newVolume
    }

    // Insert chapter row with 'generating' status (no AI content yet)
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        novel_id: novelId,
        volume_id: volume?.id || null,
        chapter_number: chapterNumber,
        title: null,
        content: null,
        raw_entry: rawEntry,
        entry_mode: 'freeform',
        entry_date: entryDate,
        status: 'generating',
        mood: null,
        mood_score: null,
        tags: [],
        opening_quote: null,
        word_count: 0,
      })
      .select()
      .single()

    if (chapterError) {
      return NextResponse.json({ error: chapterError.message }, { status: 500 })
    }

    // Update novel's updated_at
    await supabase
      .from('novels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', novelId)

    return NextResponse.json({ chapterId: chapter.id, status: 'generating' })
  } catch (error: unknown) {
    console.error('Chapter generation error:', error)
    return NextResponse.json({ error: 'Failed to start chapter generation' }, { status: 500 })
  }
}
```

**Key changes from the original:**
- No longer calls `generateChapter()` or `buildChapterPrompt()`
- Inserts the chapter row with `status: 'generating'` and `content: null`
- Returns `{ chapterId, status: 'generating' }` immediately
- Edit mode: updates existing row to `generating` instead of regenerating inline
- Removed imports: `buildChapterPrompt`, `generateChapter`

**Step 2: Commit**

```bash
git add app/api/generate-chapter/route.ts
git commit -m "refactor: generate-chapter returns immediately with generating status"
```

---

### Task 4: Create `POST /api/process-chapter` — Background AI Generation

**Files:**
- Create: `app/api/process-chapter/route.ts`

This is the long-running endpoint that does the actual AI generation. Called by the client with `keepalive: true` (fire-and-forget). It loads all context, calls NVIDIA API, and updates the chapter row.

**Step 1: Create the route**

Create `app/api/process-chapter/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildChapterPrompt } from '@/lib/ai/prompts'
import { generateChapter } from '@/lib/ai/chapter-generator'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  let chapterId: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    chapterId = body.chapterId
    const editInstruction: string | undefined = body.editInstruction

    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 })
    }

    // Fetch the chapter (must be in 'generating' state)
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('status', 'generating')
      .single()

    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found or not in generating state' }, { status: 404 })
    }

    // Fetch novel
    const { data: novel } = await supabase
      .from('novels')
      .select('*')
      .eq('id', chapter.novel_id)
      .single()

    if (!novel) {
      await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // Get volume info for the chapter
    let volumeNumber = 1
    let entryYear = new Date(chapter.entry_date).getFullYear()
    if (chapter.volume_id) {
      const { data: volume } = await supabase
        .from('volumes')
        .select('volume_number, year')
        .eq('id', chapter.volume_id)
        .single()
      if (volume) {
        volumeNumber = volume.volume_number
        entryYear = volume.year
      }
    }

    // Fetch context: recent chapters, profiles, relationships
    const [recentResult, profilesResult, relationshipsResult] = await Promise.all([
      supabase
        .from('chapters')
        .select('title, content, mood, chapter_number')
        .eq('novel_id', chapter.novel_id)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('chapter_number', { ascending: false })
        .limit(3),
      supabase.from('story_profiles').select('*').eq('user_id', user.id),
      supabase.from('profile_relationships').select('*').eq('user_id', user.id),
    ])

    // Build prompt
    const isQuickEdit = !!editInstruction?.trim()
    const { system, user: userPrompt } = buildChapterPrompt(
      novel,
      chapter.raw_entry,
      chapter.entry_date,
      chapter.chapter_number,
      volumeNumber,
      entryYear,
      recentResult.data || [],
      profilesResult.data || [],
      isQuickEdit ? editInstruction : undefined,
      relationshipsResult.data || []
    )

    // Call AI
    let result
    try {
      result = await generateChapter(system, userPrompt)
    } catch (genError: unknown) {
      console.error('AI generation failed for chapter', chapterId, ':', genError)
      await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      return NextResponse.json({ error: 'AI generation failed', status: 'failed' }, { status: 502 })
    }

    // Update chapter with generated content
    const { error: updateError } = await supabase
      .from('chapters')
      .update({
        status: 'completed',
        title: result.title,
        content: result.content,
        mood: result.mood,
        mood_score: result.mood_score,
        tags: result.tags,
        opening_quote: result.opening_quote,
        word_count: result.content.split(/\s+/).length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId)

    if (updateError) {
      console.error('Failed to save chapter', chapterId, ':', updateError)
      await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      return NextResponse.json({ error: 'Failed to save chapter', status: 'failed' }, { status: 500 })
    }

    // Update novel timestamp
    await supabase
      .from('novels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chapter.novel_id)

    return NextResponse.json({ chapterId, status: 'completed' })
  } catch (error: unknown) {
    console.error('Process chapter error:', error)
    // Try to mark as failed if we have the chapterId
    if (chapterId) {
      try {
        const supabase = await createClient()
        await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      } catch {
        // Best effort
      }
    }
    return NextResponse.json({ error: 'Failed to process chapter', status: 'failed' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/process-chapter/route.ts
git commit -m "feat: add process-chapter endpoint for background AI generation"
```

---

### Task 5: Create `GET /api/chapter-status` — Polling Endpoint

**Files:**
- Create: `app/api/chapter-status/route.ts`

Simple endpoint that returns the status of one or more chapters. Used by the write page (single chapter poll) and the novel page (batch poll).

**Step 1: Create the route**

Create `app/api/chapter-status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('id')
    const novelId = searchParams.get('novelId')

    // Single chapter status check (used by write page polling)
    if (chapterId) {
      const { data: chapter } = await supabase
        .from('chapters')
        .select('id, status, created_at')
        .eq('id', chapterId)
        .single()

      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      }

      return NextResponse.json({
        chapterId: chapter.id,
        status: chapter.status,
        createdAt: chapter.created_at,
      })
    }

    // Batch status check for a novel (used by novel page polling)
    if (novelId) {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, status, created_at')
        .eq('novel_id', novelId)
        .in('status', ['generating', 'failed'])
        .is('deleted_at', null)

      return NextResponse.json({ chapters: chapters || [] })
    }

    return NextResponse.json({ error: 'Provide id or novelId parameter' }, { status: 400 })
  } catch (error) {
    console.error('Chapter status error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/chapter-status/route.ts
git commit -m "feat: add chapter-status polling endpoint"
```

---

### Task 6: Update Write Page — New Async Flow

**Files:**
- Modify: `app/(dashboard)/write/freeform/page.tsx` (the `doGenerate` function, lines 62-108)

The write page currently awaits the full generation. We change it to:
1. Call `generate-chapter` (fast — just inserts row)
2. Fire `process-chapter` with `keepalive: true` (fire-and-forget)
3. Poll `chapter-status` every 5s
4. If completed within 30s → redirect to reader
5. If 30s passes → show toast, redirect to novel page

**Step 1: Rewrite the `doGenerate` function and add polling + toast**

In `app/(dashboard)/write/freeform/page.tsx`:

Add `Toast` import at the top alongside existing imports:
```typescript
import { Toast } from '@/components/ui/Toast'
```

Add toast state alongside existing state (after line 30):
```typescript
const [toastMessage, setToastMessage] = useState('')
const [showToast, setShowToast] = useState(false)
```

Replace the entire `doGenerate` function (lines 62-108) with:

```typescript
  async function doGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      // Step 1: Create chapter row with 'generating' status (fast)
      const startResponse = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate,
          ...(isEditing && { chapterId }),
        }),
      })

      if (!startResponse.ok) {
        let message = 'Failed to start chapter generation'
        try {
          const err = await startResponse.json()
          message = err.error || message
        } catch {
          // Response wasn't JSON
        }
        throw new Error(message)
      }

      const { chapterId: generatingChapterId } = await startResponse.json()

      // Step 2: Fire background AI generation (fire-and-forget)
      fetch('/api/process-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: generatingChapterId,
          ...(isEditing && chapterId && { editInstruction: undefined }),
        }),
        keepalive: true,
      }).catch(() => {
        // Fire-and-forget: errors handled by status polling
      })

      // Step 3: Poll for completion (every 5s, up to 30s)
      const POLL_INTERVAL = 5000
      const MAX_WAIT = 30000
      const startTime = Date.now()

      const pollForCompletion = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const interval = setInterval(async () => {
            const elapsed = Date.now() - startTime
            if (elapsed >= MAX_WAIT) {
              clearInterval(interval)
              resolve(null) // Timed out
              return
            }

            try {
              const statusRes = await fetch(`/api/chapter-status?id=${generatingChapterId}`)
              if (statusRes.ok) {
                const data = await statusRes.json()
                if (data.status === 'completed') {
                  clearInterval(interval)
                  resolve('completed')
                } else if (data.status === 'failed') {
                  clearInterval(interval)
                  resolve('failed')
                }
              }
            } catch {
              // Polling error, keep trying
            }
          }, POLL_INTERVAL)
        })
      }

      const result = await pollForCompletion()

      if (result === 'completed') {
        // AI finished in time — redirect to reader
        reset()
        router.push(`/novel/${novelId}/chapter/${generatingChapterId}`)
      } else if (result === 'failed') {
        // AI failed — show error
        setError('Chapter generation failed. You can retry from the novel page.')
        setIsGenerating(false)
      } else {
        // Timed out (30s) — redirect to novel page with toast
        reset()
        setToastMessage('Your chapter is being crafted in the background. Check back shortly!')
        setShowToast(true)
        setTimeout(() => {
          router.push(`/novel/${novelId}`)
        }, 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }
```

Add the Toast component at the bottom of the JSX return, just before the closing `</div>`:

```tsx
      <Toast
        message={toastMessage}
        type="info"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
```

Also handle the quick-edit flow: In the `doGenerate` function's fire-and-forget fetch, if there was an `editInstruction` from the search params or a quick edit modal, pass it through. Check how `ProfileQuestionModal` calls `doGenerate` — it goes through `handleProfileAnswers` which calls `doGenerate()` directly. The quick edit instruction would come from a different flow (ChapterActions). For this task, we handle the standard write + edit-raw-entry flows. The quick edit modal (ChapterActions) is a separate component that calls the API directly — it will need a similar update in Task 10.

**Step 2: Commit**

```bash
git add app/(dashboard)/write/freeform/page.tsx
git commit -m "feat: write page uses async generation with 30s polling + toast redirect"
```

---

### Task 7: Create Status-Aware `ChapterCard` Component

**Files:**
- Create: `components/novel/ChapterCard.tsx`

This component renders a single chapter card with three visual states based on status and age.

**Step 1: Create the component**

Create `components/novel/ChapterCard.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, AlertTriangle, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Chapter } from '@/types'

const moodColors: Record<string, string> = {
  joyful: 'bg-yellow-500',
  excited: 'bg-orange-500',
  peaceful: 'bg-emerald-500',
  reflective: 'bg-blue-500',
  anxious: 'bg-amber-500',
  melancholic: 'bg-indigo-500',
  angry: 'bg-red-500',
  confused: 'bg-purple-500',
}

type GeneratingState = 'active' | 'slow' | 'failed'

function getGeneratingState(chapter: Chapter): GeneratingState {
  if (chapter.status === 'failed') return 'failed'

  const createdAt = new Date(chapter.created_at).getTime()
  const now = Date.now()
  const elapsedMs = now - createdAt

  const TEN_MINUTES = 10 * 60 * 1000
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  if (elapsedMs >= TWENTY_FOUR_HOURS) return 'failed'
  if (elapsedMs >= TEN_MINUTES) return 'slow'
  return 'active'
}

interface ChapterCardProps {
  chapter: Chapter
  novelId: string
  index: number
  onRetry?: (chapterId: string) => void
  onDelete?: (chapterId: string) => void
}

export function ChapterCard({ chapter, novelId, index, onRetry, onDelete }: ChapterCardProps) {
  // --- COMPLETED CHAPTER (normal card) ---
  if (chapter.status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
      >
        <Link
          href={`/novel/${novelId}/chapter/${chapter.id}`}
          className="block group"
        >
          <div className="flex items-start gap-3 p-3 md:p-4 rounded-xl border border-ink-border/50 bg-ink-card/50 hover:border-accent-primary/30 hover:bg-ink-card transition-all duration-200 group-hover:translate-x-1">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
              <span className="text-xs md:text-sm font-ui text-accent-primary font-medium">{chapter.chapter_number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base text-text-primary truncate group-hover:text-accent-primary transition-colors">
                {chapter.title || `Chapter ${chapter.chapter_number}`}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {new Date(chapter.entry_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {chapter.opening_quote && (
                <p className="text-sm text-text-secondary mt-1 italic truncate">
                  &ldquo;{chapter.opening_quote}&rdquo;
                </p>
              )}
            </div>
            {chapter.mood && (
              <div className="flex items-center gap-1.5 flex-shrink-0" title={chapter.mood}>
                <span className={`w-2 h-2 rounded-full ${moodColors[chapter.mood] || 'bg-text-muted'}`} />
                <span className="text-xs text-text-muted hidden md:inline">{chapter.mood}</span>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    )
  }

  // --- GENERATING / FAILED CHAPTER ---
  const state = getGeneratingState(chapter)
  const rawPreview = chapter.raw_entry?.length > 120
    ? chapter.raw_entry.substring(0, 120) + '...'
    : chapter.raw_entry

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div className={`flex items-start gap-3 p-3 md:p-4 rounded-xl border transition-all duration-200 ${
        state === 'active'
          ? 'border-accent-primary/30 bg-ink-card/50 shadow-glow-sm'
          : state === 'slow'
          ? 'border-amber-500/30 bg-ink-card/50'
          : 'border-red-500/30 bg-ink-card/50'
      }`}>
        {/* Status indicator */}
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-ink-border/30 bg-ink-surface/50">
          {state === 'active' && (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-accent-primary animate-spin" />
          )}
          {state === 'slow' && (
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
          )}
          {state === 'failed' && (
            <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-text-primary">
            Chapter {chapter.chapter_number}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(chapter.entry_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {/* Raw entry preview */}
          <p className="text-sm text-text-secondary mt-2 italic">
            {rawPreview}
          </p>

          {/* Status message */}
          <div className="mt-3">
            {state === 'active' && (
              <div>
                <p className="text-xs text-accent-primary font-ui">Crafting your chapter...</p>
                <div className="mt-2 h-1 w-full bg-ink-border/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-primary/60 to-accent-secondary/60 rounded-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
              </div>
            )}

            {state === 'slow' && (
              <div className="space-y-2">
                <p className="text-xs text-amber-500 font-ui">Taking longer than expected...</p>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(chapter.id)}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Retry Generation
                  </Button>
                )}
              </div>
            )}

            {state === 'failed' && (
              <div className="space-y-2">
                <p className="text-xs text-red-400 font-ui">
                  Sorry, due to a server issue your chapter could not be generated. Please try again.
                </p>
                <div className="flex gap-2">
                  {onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(chapter.id)}
                      className="text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Regenerate
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onDelete(chapter.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3 mr-1.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add components/novel/ChapterCard.tsx
git commit -m "feat: add ChapterCard with generating/slow/failed status states"
```

---

### Task 8: Update `ChapterList` to Use `ChapterCard`

**Files:**
- Modify: `components/novel/ChapterList.tsx`

Replace the inline chapter rendering with the new `ChapterCard` component. Add retry and delete callbacks.

**Step 1: Rewrite ChapterList**

Replace the entire contents of `components/novel/ChapterList.tsx`:

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { ChapterCard } from '@/components/novel/ChapterCard'
import type { Chapter } from '@/types'

interface ChapterListProps {
  chapters: Chapter[]
  novelId: string
  onChaptersChanged?: () => void
}

export function ChapterList({ chapters, novelId, onChaptersChanged }: ChapterListProps) {
  const supabase = createClient()

  async function handleRetry(chapterId: string) {
    // Reset chapter to 'generating' and trigger process
    await fetch('/api/generate-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, chapterId }),
    })

    // Fire background generation
    fetch('/api/process-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId }),
      keepalive: true,
    }).catch(() => {})

    onChaptersChanged?.()
  }

  async function handleDelete(chapterId: string) {
    await supabase
      .from('chapters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chapterId)

    onChaptersChanged?.()
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary font-display text-lg">No chapters yet</p>
        <p className="text-text-muted text-sm mt-1">Write your first entry to generate a chapter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {chapters.map((chapter, i) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          novelId={novelId}
          index={i}
          onRetry={handleRetry}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/novel/ChapterList.tsx
git commit -m "refactor: ChapterList uses ChapterCard with retry/delete handlers"
```

---

### Task 9: Update Novel Detail Page — Add Polling for Generating Chapters

**Files:**
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx`

The novel detail page is currently a Server Component. We need to add client-side polling when there are chapters with `status: 'generating'`. We'll create a thin client wrapper component.

**Step 1: Create the client wrapper**

Create `components/novel/NovelChapterSection.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChapterList } from '@/components/novel/ChapterList'
import { createClient } from '@/lib/supabase/client'
import type { Chapter } from '@/types'

interface NovelChapterSectionProps {
  initialChapters: Chapter[]
  novelId: string
}

export function NovelChapterSection({ initialChapters, novelId }: NovelChapterSectionProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const supabase = createClient()

  const hasGenerating = chapters.some(ch => ch.status === 'generating')

  const refreshChapters = useCallback(async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .order('chapter_number', { ascending: false })

    if (data) {
      setChapters(data)
    }
  }, [supabase, novelId])

  // Poll every 10s when there are generating chapters
  useEffect(() => {
    if (!hasGenerating) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chapter-status?novelId=${novelId}`)
        if (res.ok) {
          const data = await res.json()
          const stillGenerating = (data.chapters || []).some(
            (ch: { status: string }) => ch.status === 'generating'
          )
          // If any chapter changed status, refresh the full list
          if (!stillGenerating || data.chapters.length !== chapters.filter(c => c.status !== 'completed').length) {
            await refreshChapters()
          }
        }
      } catch {
        // Polling error, keep trying
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [hasGenerating, novelId, refreshChapters, chapters])

  return (
    <ChapterList
      chapters={chapters}
      novelId={novelId}
      onChaptersChanged={refreshChapters}
    />
  )
}
```

**Step 2: Update the novel page to use the client wrapper**

In `app/(dashboard)/novel/[novelId]/page.tsx`, replace the `ChapterList` import and usage:

Replace this import:
```typescript
import { ChapterList } from '@/components/novel/ChapterList'
```
With:
```typescript
import { NovelChapterSection } from '@/components/novel/NovelChapterSection'
```

Replace this line (near the bottom, around line 123):
```tsx
<ChapterList chapters={chapters || []} novelId={novelId} />
```
With:
```tsx
<NovelChapterSection initialChapters={chapters || []} novelId={novelId} />
```

**Step 3: Commit**

```bash
git add components/novel/NovelChapterSection.tsx app/(dashboard)/novel/[novelId]/page.tsx
git commit -m "feat: novel page polls for generating chapters, auto-refreshes on completion"
```

---

### Task 10: Update Quick Edit Flow (ChapterActions)

**Files:**
- Modify: `components/novel/ChapterActions.tsx`

The ChapterActions component has a "Quick Edit" feature that calls `/api/generate-chapter` with an `editInstruction`. This needs to use the new two-step flow.

**Step 1: Find and read ChapterActions**

Read `components/novel/ChapterActions.tsx` to understand the current quick edit flow.

**Step 2: Update the quick edit handler**

Find the section that calls `/api/generate-chapter` with `editInstruction` and update it to:
1. Call `/api/generate-chapter` with `{ novelId, chapterId, editInstruction }` → gets back `{ chapterId, status: 'generating' }`
2. Fire `/api/process-chapter` with `{ chapterId, editInstruction }` using `keepalive: true`
3. Redirect to the novel page (since the chapter is now in `generating` state)

The exact code depends on the current structure of ChapterActions. Follow the same pattern as the write page: start → process (fire-and-forget) → redirect.

**Step 3: Commit**

```bash
git add components/novel/ChapterActions.tsx
git commit -m "feat: quick edit uses async generation flow"
```

---

### Task 11: Build Verification

**Step 1: Run the Next.js build**

```bash
cd /c/Users/DSI-LPT-081/Desktop/Inkbound && npm run build
```

Expected: Build succeeds with zero errors.

**Common issues to check for:**
- `content: string` → `content: string | null` — any component that accesses `chapter.content` without checking for null will error. Check `ChapterReader.tsx`, `ChapterPageClient.tsx`, etc. Add null guards where needed (e.g., `chapter.content || ''`).
- The `Chapter` type change affects all places that use it. Search for `chapter.content` and ensure null safety.

**Step 2: Fix any type errors**

Search for all usages of `chapter.content` that don't handle null. Common files:
- `components/novel/ChapterReader.tsx` — the reader only shows completed chapters, so add a guard at the top: `if (!chapter.content) return null`
- `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx` — server page fetches chapter; add a check that redirects to novel page if chapter is still generating
- Any place that calls `.split()` or `.length` on `chapter.content`

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: handle nullable chapter.content across components"
```

---

### Task 12: Final Commit and Summary

**Step 1: Run the build one final time**

```bash
npm run build
```

Expected: Clean build, zero errors.

**Step 2: Squash or organize commits if desired, then push**

```bash
git push origin main
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/007_chapter_status.sql` | Create | Add `status` column |
| `types/index.ts` | Modify | Add `ChapterStatus`, make `content` nullable |
| `app/api/generate-chapter/route.ts` | Modify | Insert row + return immediately (no AI) |
| `app/api/process-chapter/route.ts` | Create | Background AI generation endpoint |
| `app/api/chapter-status/route.ts` | Create | Polling endpoint |
| `app/(dashboard)/write/freeform/page.tsx` | Modify | Async flow: poll 30s, then redirect |
| `components/novel/ChapterCard.tsx` | Create | Status-aware card (generating/slow/failed) |
| `components/novel/ChapterList.tsx` | Modify | Use ChapterCard, add retry/delete |
| `components/novel/NovelChapterSection.tsx` | Create | Client wrapper with polling |
| `app/(dashboard)/novel/[novelId]/page.tsx` | Modify | Use NovelChapterSection |
| `components/novel/ChapterActions.tsx` | Modify | Quick edit uses async flow |

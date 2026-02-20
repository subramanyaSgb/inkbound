# Async Chapter Generation Design

**Date:** 2026-02-20
**Status:** Approved

## Problem

When users click "Generate," they see a full-screen loading animation and wait up to 120 seconds. If the AI is slow or fails silently, the user is stuck with no feedback and no way to recover.

## Solution

Background/async chapter generation with a database status column, progressive UI updates, and automatic retry/failure handling.

## Approach: Database Status Column

Add a `status` column to the `chapters` table (`generating` | `completed` | `failed`). Insert the chapter row immediately before calling the AI, then update it asynchronously when the AI responds.

## Database Changes

**New migration:** `007_chapter_status.sql`

- Add `status TEXT DEFAULT 'completed'` to `chapters` table
- Valid values: `generating`, `completed`, `failed`
- Default `completed` so all existing chapters are unaffected
- Add index on `(novel_id, status)` for efficient queries

## API Changes

### `POST /api/generate-chapter` — Restructured

**Phase 1 (immediate, before AI call):**
1. Auth + validation + rate limit (same as today)
2. Insert chapter row with `status='generating'`, `raw_entry` saved, `content=NULL`
3. Return `{ chapterId, status: 'generating' }` to client immediately

**Phase 2 (background, via `waitUntil`):**
1. Call NVIDIA API (Step 3.5 Flash)
2. On success: `UPDATE chapter SET status='completed', content=..., title=..., mood=...`
3. On failure: `UPDATE chapter SET status='failed'`

Uses `waitUntil` from `next/server` to keep the function alive after the response is sent. Works on Vercel and in local dev.

### `GET /api/chapter-status` — New Endpoint

- Query: `?id={chapterId}`
- Auth check (user must own the chapter's novel)
- Returns `{ status, chapterId }`
- If `status='completed'`, also returns basic chapter info

## Write Page Flow Changes

**Current:** Click Generate -> animation -> wait up to 120s -> redirect to reader OR error.

**New:**
1. User clicks Generate -> API immediately inserts chapter with `status: 'generating'`, returns `{ chapterId }`
2. Show existing ink-drop animation (no changes to animation component)
3. While animation plays, poll `GET /api/chapter-status?id={chapterId}` every 5 seconds
4. **If completed within 30s** -> redirect to chapter reader as usual (feels instant)
5. **If still generating after 30s** -> show toast: "Your chapter is being crafted in the background. We'll have it ready when you come back!" -> redirect to novel detail page

## Chapter List UI — Status-Aware Cards

### State 1: Generating (0-10 min)
- Gold pulsing dot instead of normal chapter number badge
- Shows truncated `raw_entry` (user's original journal text)
- Animated shimmer progress bar
- Subtle glow border to draw attention
- Not clickable (no content yet)
- Text: "Crafting your chapter..."

### State 2: Taking Too Long (10 min - 24 hr)
- Amber warning dot
- Shows truncated `raw_entry`
- Text: "Taking longer than expected..."
- "Retry Generation" button — calls generate API with saved `raw_entry`

### State 3: Failed (24+ hours OR explicit failure)
- Red dot
- Shows truncated `raw_entry`
- Text: "Sorry, due to a server issue your chapter could not be generated. Please try again."
- Two actions: "Regenerate Chapter" and "Delete"

### Time Detection
- Compare `created_at` of generating chapter vs current time
- < 10 min -> State 1
- 10 min - 24 hr -> State 2
- > 24 hr -> State 3

### Polling on Novel Page
- When page loads and any chapter has `status: 'generating'`, poll `/api/chapter-status` every 10 seconds
- When status flips to `completed`, refresh chapter list to show normal card
- Stop polling when no chapters are in `generating` state

## Edge Cases

- **User closes browser during animation:** Chapter row already saved, background continues. User sees card next visit.
- **AI returns invalid JSON:** Catch parse error, set `status: 'failed'`.
- **NVIDIA API down (502/503):** Catch network error, set `status: 'failed'`.
- **Retry clicked:** New API call with same `raw_entry` from existing chapter. Updates same row.
- **Another entry while one generates:** Works fine, each chapter has its own row and status.
- **Multiple generating chapters:** Poll checks all at once via single query.

## Files to Change

| File | Change |
|------|--------|
| `supabase/migrations/007_chapter_status.sql` | New — add `status` column |
| `types/index.ts` | Add `ChapterStatus` type, update `Chapter` interface |
| `app/api/generate-chapter/route.ts` | Restructure — insert first, background generate with `waitUntil` |
| `app/api/chapter-status/route.ts` | New — GET endpoint for polling |
| `app/(dashboard)/write/freeform/page.tsx` | New flow — poll for 30s, then redirect with toast |
| `components/novel/ChapterList.tsx` | Add generating/retry/failed card states |
| `app/(dashboard)/novel/[novelId]/page.tsx` | Add polling logic when generating chapters exist |
| `components/novel/ChapterCard.tsx` | New — extract card into component with status-aware rendering |

## Files NOT Changed

- `GeneratingAnimation.tsx` — stays as-is
- `ChapterReader.tsx` — stays as-is
- `write-store.ts` — stays as-is
- `lib/ai/chapter-generator.ts` — stays as-is
- `lib/ai/prompts.ts` — stays as-is

## User Journey

```
Write entry -> Click Generate
       |
       +-- AI responds in <30s -> Redirect to chapter reader (same as today)
       |
       +-- AI still working at 30s -> Toast message -> Redirect to novel page
              |
              +-- Chapter list shows "Crafting your chapter..." card
              |   (polls every 10s, auto-refreshes when done)
              |
              +-- After 10 min -> Card shows "Retry" button
              |
              +-- After 24 hr -> Card shows error + "Regenerate" / "Delete"
```

## No Breaking Changes

Existing chapters get `status: 'completed'` by default, so everything works as before for old data.

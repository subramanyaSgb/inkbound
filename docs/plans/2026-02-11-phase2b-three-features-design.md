# Phase 2B — Three Features Design

**Date:** 2026-02-11
**Status:** Approved
**Scope:** 3 features — Life Stats Dashboard, Reading Progress + Search, Guided Conversation

---

## Feature 1: Life Stats Dashboard

### Overview
Two stats pages: global (`/stats`) and per-novel (`/novel/[id]/stats`). Uses Recharts for charts. Dark theme with gold accents matching Leather Dark.

### Pages
- **Global stats** (`/stats`) — New nav item in sidebar + mobile bottom nav. Aggregates data across all novels.
- **Per-novel stats** (`/novel/[novelId]/stats`) — Linked from novel detail page. Shows stats for that novel only.

### Widgets (8 total)

#### 1. Mood Arc Chart
- **Data:** `mood_score` (0-1 float) per chapter, plotted by `entry_date`
- **Visual:** Recharts `AreaChart` with gradient fill. Gold line, dark bg.
- **Controls:** Time range toggle: 7d / 30d / 90d / All
- **Global version:** Overlay lines from multiple novels (different colors)

#### 2. Writing Streak
- **Data:** `entry_date` from chapters, calculate consecutive days
- **Visual:** Big number display with current streak, longest streak, total entries
- **Accent:** Flame/fire icon when streak is active

#### 3. Mood Calendar Heatmap
- **Data:** `mood_score` per `entry_date`
- **Visual:** Monthly grid (GitHub contribution style). Color scale:
  - No entry: dark/empty
  - Low mood (0-0.3): deep blue/purple
  - Medium (0.3-0.6): muted gold
  - High mood (0.6-1.0): bright gold/green
- **Interaction:** Tap a day to see mood + chapter title

#### 4. Tag Cloud
- **Data:** All `tags[]` aggregated, counted
- **Visual:** Sized by frequency, accent color variations
- **Interaction:** Tap a tag to see all chapters with that tag

#### 5. Chapter & Word Stats
- **Data:** Chapter count, `word_count` sum, averages
- **Visual:** 4 stat cards in a 2x2 grid:
  - Total Chapters
  - Total Words
  - Avg Words/Chapter
  - Longest Chapter (with link)

#### 6. Top Soundtracks
- **Data:** `soundtrack_suggestion` strings, parsed and grouped
- **Visual:** Ranked list (top 10), song + artist, mention count
- **Like a personal playlist**

#### 7. Best Quotes Collection
- **Data:** `opening_quote` from each chapter
- **Visual:** Scrollable carousel or stacked cards
- **Each card:** Quote text + chapter title + chapter link

#### 8. Genre of Your Life
- **Data:** Recent moods, tags, themes sent to AI for analysis
- **Visual:** Single hero card with genre label + AI explanation
- **AI Call:** New `/api/analyze-genre` endpoint, uses recent chapter data
- **Updates:** Regenerates on demand or when new chapters are added
- **Global version:** Analyzes all novels combined

### Layout (Mobile-first)
```
Mobile (single column, scrollable):
┌─────────────────────────┐
│  Writing Streak Banner  │
├─────────────────────────┤
│  Mood Arc Chart         │
├─────────────────────────┤
│  Mood Calendar Heatmap  │
├─────────────────────────┤
│  Chapter & Word Stats   │
│  [2x2 grid]             │
├─────────────────────────┤
│  Genre of Your Life     │
├─────────────────────────┤
│  Tag Cloud              │
├─────────────────────────┤
│  Top Soundtracks        │
├─────────────────────────┤
│  Best Quotes            │
└─────────────────────────┘

Desktop: 2-column grid with streak banner spanning full width
```

---

## Feature 2: Reading Progress + Search

### Reading Progress

**Database:**
```sql
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  last_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  chapters_read INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON reading_progress
  FOR ALL USING (auth.uid() = user_id);
```

**Auto-tracking:**
- When user opens a chapter page, upsert `reading_progress` with that chapter's id
- Increment `chapters_read` if this chapter hasn't been read before

**Novel card changes:**
- If reading progress exists, show "Continue Ch. X" button
- Small progress bar: chapters_read / total_chapters
- Progress bar color: accent-primary

**Novel detail page:**
- "Continue Reading" button above chapter list if progress exists

### Chapter Search

**Page:** `/novel/[novelId]/search`

**Search UI:**
- Search input (queries `title` and `content` via Supabase `ilike`)
- Mood filter: dropdown with mood options
- Tag filter: clickable tag chips (from all tags in this novel)
- Date range: two date inputs (from/to)

**Results:**
- Chapter cards showing: title, date, mood badge, matching snippet (highlighted)
- Clicking opens the chapter

**Linked from:** Novel detail page — search icon next to "Chapters" heading

---

## Feature 3: Guided Conversation

### Overview
Chat-style AI conversation mode at `/write/guided?novelId={id}`. WhatsApp-like bubbles. Streaming responses.

### Flow
1. User selects "Guided" from write mode selection
2. AI sends opening message: "Hey! Tell me about your day — what happened?"
3. User types response
4. AI adapts:
   - Short/vague → digs deeper ("Who did you meet? What did you talk about?")
   - Rich/detailed → moves on ("Great! Anything else about your evening?")
5. After 3+ exchanges, "Ready to generate!" floating button appears
6. User taps generate → all messages combined into raw entry → same generation API
7. Typewriter loading → chapter reader

### API
**New endpoint:** `/api/guided-chat`
- Method: POST
- Body: `{ novelId, messages: [{role, content}[]] }`
- Response: Server-Sent Events (streaming)
- System prompt instructs AI to be a warm, curious interviewer
- Adapts question depth based on response richness
- Max ~8 questions, then gently wraps up

### UI Components
- `GuidedChat` — Full chat interface with:
  - AI message bubbles (left-aligned, subtle bg)
  - User message bubbles (right-aligned, accent bg)
  - Auto-scroll to latest message
  - Typing indicator (three dots animation) during AI streaming
- Chat input bar fixed at bottom (send button + future mic icon)
- "Generate Chapter" floating button (appears after 3+ exchanges)
- "That's enough" shortcut to skip to generation

### Mobile Layout
- Full-screen chat, no sidebars
- Input bar fixed at bottom (like messaging apps)
- Smooth keyboard handling

### Raw Entry Assembly
When user hits "Generate":
- Combine all user messages into a single raw_entry string
- Prepend date
- Send to existing `/api/generate-chapter` with `entryMode: 'guided'`

---

## Implementation Priority

1. **Stats Dashboard** — Recharts install, 2 pages, 8 widgets, 1 new API endpoint
2. **Reading Progress + Search** — DB migration, auto-tracking, search page
3. **Guided Conversation** — Streaming API, full chat UI, message assembly

---

## Dependencies

- `recharts` — Chart library for Stats Dashboard
- No other new dependencies needed
- Guided conversation streaming uses native `ReadableStream` / `EventSource`

# 🖋️ INKBOUND — Product Requirements Document

### *Your life, bound in ink.*

**Version:** 1.0
**Date:** February 8, 2026
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + Anthropic API
**Deployment:** Vercel
**Design Philosophy:** Mobile-first, dark & moody leather journal aesthetic

---

## 1. Product Overview

### 1.1 What is Inkbound?

Inkbound is a private, AI-powered life journal that transforms your everyday experiences into an evolving novel. Users record what happened in their day — through free-form writing, AI-guided conversations, or structured prompts — and AI converts those entries into beautifully written novel chapters. Over time, your life becomes a multi-volume literary work, complete with recurring characters, evolving plotlines, dynamic cover art, and your own personal writing style.

### 1.2 Core Value Proposition

- **Input:** Your raw, unfiltered daily life
- **Output:** A professionally written, ongoing novel about YOU
- **Magic:** AI remembers characters, places, patterns, and weaves them into a continuous narrative

### 1.3 Target User

- Journaling enthusiasts who want more than a diary
- People who love reading and want to see their life as a story
- Users who struggle with traditional journaling but can "talk about their day"
- Anyone who wants a creative, private record of their life

---

## 2. Tech Stack & Architecture

### 2.1 Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | Framework — SSR, routing, API routes |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling — mobile-first, responsive |
| **Framer Motion** | Animations & transitions |
| **next-themes** | Theme management (multiple themes) |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form handling & validation |

### 2.2 Backend & Database

| Technology | Purpose |
|---|---|
| **Supabase** | Auth, PostgreSQL database, storage (cover images), realtime |
| **Supabase Auth** | Email/password + OAuth (Google, GitHub) |
| **Supabase Storage** | AI-generated cover images, exports |
| **Next.js API Routes** | Server-side AI calls, PDF generation |

### 2.3 AI & External APIs

| Technology | Purpose |
|---|---|
| **Anthropic Claude API** (claude-sonnet-4-20250514) | Novel chapter generation, character profiles, life stats, guided conversations, cover prompts |
| **Image Generation API** (DALL·E 3 or Stable Diffusion) | Dynamic cover page generation |
| **Spotify API** *(optional, Phase 3)* | Soundtrack suggestions per chapter |

### 2.4 Deployment

| Service | Purpose |
|---|---|
| **Vercel** | Hosting, edge functions, CI/CD |
| **GitHub** | Version control |
| **Supabase Cloud** | Managed database |

### 2.5 Project Structure

```
inkbound/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Home — novel library
│   │   ├── novel/
│   │   │   ├── [novelId]/
│   │   │   │   ├── page.tsx            # Novel detail — chapters list
│   │   │   │   ├── read/page.tsx       # Reading mode — full novel
│   │   │   │   ├── chapter/
│   │   │   │   │   └── [chapterId]/page.tsx  # Single chapter view
│   │   │   │   ├── characters/page.tsx # Character profiles
│   │   │   │   ├── stats/page.tsx      # Life stats dashboard
│   │   │   │   ├── quotes/page.tsx     # Quote wall
│   │   │   │   └── settings/page.tsx   # Novel customization
│   │   │   └── new/page.tsx            # Create new novel
│   │   ├── write/
│   │   │   ├── page.tsx                # Entry mode selector
│   │   │   ├── freeform/page.tsx       # Free-form writing
│   │   │   ├── guided/page.tsx         # AI-guided conversation
│   │   │   └── structured/page.tsx     # Structured prompts
│   │   ├── time-machine/page.tsx       # On this day...
│   │   ├── settings/page.tsx           # App settings & themes
│   │   └── layout.tsx                  # Dashboard layout with sidebar/nav
│   ├── api/
│   │   ├── generate-chapter/route.ts
│   │   ├── generate-cover/route.ts
│   │   ├── generate-stats/route.ts
│   │   ├── generate-summary/route.ts
│   │   ├── generate-profiles/route.ts
│   │   ├── guided-chat/route.ts
│   │   ├── export-pdf/route.ts
│   │   └── alternate-universe/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   └── ThemeToggle.tsx
│   ├── novel/
│   │   ├── NovelCard.tsx               # Novel in library grid
│   │   ├── ChapterList.tsx
│   │   ├── ChapterReader.tsx           # Book-like reading experience
│   │   ├── CoverPage.tsx               # Dynamic cover display
│   │   ├── NovelSettings.tsx
│   │   └── VolumeSelector.tsx
│   ├── write/
│   │   ├── FreeformEditor.tsx
│   │   ├── GuidedChat.tsx
│   │   ├── StructuredForm.tsx
│   │   ├── EntryModeSelector.tsx
│   │   └── GeneratingAnimation.tsx     # Novel generation loading state
│   ├── stats/
│   │   ├── MoodChart.tsx               # Emotion arc over time
│   │   ├── LifeStatsDashboard.tsx
│   │   ├── CharacterProfileCard.tsx
│   │   └── QuoteWall.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   ├── Header.tsx
│   │   └── StreakBanner.tsx
│   └── shared/
│       ├── SearchBar.tsx
│       ├── TagPills.tsx
│       └── BookmarkToggle.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── prompts.ts                  # All AI prompt templates
│   │   ├── chapter-generator.ts
│   │   ├── guided-conversation.ts
│   │   └── stats-analyzer.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── export.ts
│   │   └── theme.ts
│   └── constants.ts                    # Genres, styles, POVs, etc.
├── stores/
│   ├── novel-store.ts
│   ├── write-store.ts
│   └── theme-store.ts
├── types/
│   └── index.ts                        # All TypeScript interfaces
├── public/
│   ├── fonts/
│   └── images/
├── styles/
│   └── themes/                         # Multiple theme CSS files
├── middleware.ts                        # Auth middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Database Schema (Supabase / PostgreSQL)

### 3.1 Tables

```sql
-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_theme TEXT DEFAULT 'leather-dark',
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOVELS
-- ============================================
CREATE TABLE novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  character_name TEXT NOT NULL DEFAULT 'the protagonist',
  genre TEXT NOT NULL DEFAULT 'literary',
  -- genres: literary, comedy, thriller, fantasy, romance, scifi, poetic, noir
  pov TEXT NOT NULL DEFAULT 'first',
  -- pov: first, third, second
  writing_style TEXT NOT NULL DEFAULT 'modern',
  -- styles: modern, classic, murakami, hemingway, whimsical, stream
  cover_image_url TEXT,
  cover_prompt TEXT,                       -- AI prompt used for cover generation
  start_date DATE,                         -- Can be user's birth date or any start
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOLUMES (one per year)
-- ============================================
CREATE TABLE volumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  volume_number INTEGER NOT NULL,
  title TEXT,                              -- e.g., "Volume I: The Awakening"
  prologue TEXT,                           -- AI-generated prologue
  epilogue TEXT,                           -- AI-generated epilogue (end of year)
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, year)
);

-- ============================================
-- CHAPTERS (one per day entry)
-- ============================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  volume_id UUID REFERENCES volumes(id) ON DELETE SET NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT,                              -- AI-generated chapter title
  content TEXT NOT NULL,                   -- The novel chapter text
  raw_entry TEXT NOT NULL,                 -- Original user journal input
  entry_mode TEXT NOT NULL DEFAULT 'freeform',
  -- modes: freeform, guided, structured
  entry_date DATE NOT NULL,
  mood TEXT,                               -- AI-detected mood
  mood_score FLOAT,                        -- -1.0 (sad) to 1.0 (happy)
  tags TEXT[] DEFAULT '{}',                -- User + AI tags
  opening_quote TEXT,                      -- AI-generated chapter quote
  illustration_url TEXT,                   -- AI-generated chapter art
  soundtrack_suggestion TEXT,              -- AI mood-based music suggestion
  is_bookmarked BOOLEAN DEFAULT false,
  is_summary BOOLEAN DEFAULT false,        -- Weekly/monthly summary chapter
  summary_type TEXT,                       -- 'weekly' or 'monthly' or null
  word_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,               -- For regeneration tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAPTER VERSIONS (edit/regenerate history)
-- ============================================
CREATE TABLE chapter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  raw_entry TEXT NOT NULL,
  genre_override TEXT,                     -- If regenerated with different genre
  style_override TEXT,                     -- If regenerated with different style
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHARACTERS (recurring people in your life)
-- ============================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  real_name TEXT,                           -- Optional: real name for user reference
  novel_name TEXT NOT NULL,                -- Name used in the novel
  relationship TEXT,                        -- e.g., "best friend", "coworker", "mother"
  description TEXT,                         -- AI-generated character profile
  personality_traits TEXT[],
  first_appearance_chapter UUID REFERENCES chapters(id),
  mention_count INTEGER DEFAULT 0,
  last_mentioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLACES (recurring locations)
-- ============================================
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  novel_description TEXT,                  -- How AI describes this place in the novel
  mention_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUOTES WALL
-- ============================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  quote_text TEXT NOT NULL,
  is_user_picked BOOLEAN DEFAULT false,    -- User manually selected vs AI picked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LIFE STATS SNAPSHOTS
-- ============================================
CREATE TABLE life_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,                    -- 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  most_mentioned_character TEXT,
  dominant_mood TEXT,
  avg_mood_score FLOAT,
  recurring_themes TEXT[],
  word_count_total INTEGER,
  chapter_count INTEGER,
  ai_analysis TEXT,                        -- AI narrative summary of the period
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER THEMES
-- ============================================
CREATE TABLE user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  theme_data JSONB NOT NULL,               -- Colors, fonts, spacing, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GUIDED CONVERSATION MESSAGES
-- ============================================
CREATE TABLE guided_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,                       -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_chapters_novel_date ON chapters(novel_id, entry_date);
CREATE INDEX idx_chapters_tags ON chapters USING GIN(tags);
CREATE INDEX idx_chapters_mood ON chapters(novel_id, mood_score);
CREATE INDEX idx_characters_novel ON characters(novel_id);
CREATE INDEX idx_volumes_novel ON volumes(novel_id);
CREATE INDEX idx_quotes_novel ON quotes(novel_id);
CREATE INDEX idx_life_stats_novel ON life_stats(novel_id, period_start);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guided_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY "Users own profiles" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own novels" ON novels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own volumes" ON volumes FOR ALL
  USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));
CREATE POLICY "Users own chapters" ON chapters FOR ALL
  USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));
CREATE POLICY "Users own chapter_versions" ON chapter_versions FOR ALL
  USING (chapter_id IN (SELECT c.id FROM chapters c JOIN novels n ON c.novel_id = n.id WHERE n.user_id = auth.uid()));
CREATE POLICY "Users own characters" ON characters FOR ALL
  USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));
CREATE POLICY "Users own places" ON places FOR ALL
  USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));
CREATE POLICY "Users own quotes" ON quotes FOR ALL
  USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));
CREATE POLICY "Users own life_stats" ON life_stats FOR ALL
  USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));
CREATE POLICY "Users own themes" ON user_themes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own guided_messages" ON guided_messages FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Feature Specifications

### 4.1 📝 Entry System (Input Modes)

#### 4.1.1 Free-form Dump
- Full-screen text editor with a warm, inviting placeholder: *"Tell me about your day... What happened? Who did you see? How did you feel?"*
- Auto-save as draft every 30 seconds
- No character limit
- Support for basic text entry (no rich formatting needed — AI handles the prose)
- Mobile: Full-screen editor with comfortable thumb-zone submit button

#### 4.1.2 AI-Guided Conversation
- Chat-style interface where AI asks questions one by one
- AI adapts questions based on previous answers
- Default question flow:
  1. "How did your day start? What time did you wake up and how were you feeling?"
  2. "What was the most notable thing that happened today?"
  3. "Did you have any interesting conversations? What was said?"
  4. "What were you thinking about the most today?"
  5. "How are you feeling right now as the day ends?"
  6. "Anything else you want to capture about today?"
- AI can ask follow-up questions based on user responses
- User can end conversation at any point and generate chapter
- All messages are concatenated as the raw entry for chapter generation

#### 4.1.3 Structured Prompts
- Card-based sections the user fills in:
  - 🌅 **Morning** — How did you wake up? First thoughts?
  - 📋 **Events** — What happened today? Key moments?
  - 💬 **Conversations** — Notable things people said, your responses?
  - 🧠 **Thoughts** — What was on your mind?
  - ❤️ **Feelings** — Emotional state throughout the day?
  - ⭐ **Highlight** — Best moment of the day?
  - 😔 **Low Point** — Worst or hardest moment? (optional)
  - 🔮 **Tomorrow** — What are you looking forward to or dreading?
- Each section is optional — user fills what they want
- All filled sections are combined as the raw entry

### 4.2 📖 Novel Generation Engine

#### 4.2.1 Chapter Generation
- **Trigger:** User submits a daily entry
- **AI Input:**
  - Raw journal entry
  - Novel settings (genre, POV, style, character name)
  - Last 3-5 chapters (for continuity)
  - Character registry (names, relationships, traits)
  - Places registry
- **AI Output:**
  - Chapter title
  - Chapter content (500-1500 words depending on entry richness)
  - Opening quote for the chapter
  - Detected mood + mood score (-1.0 to 1.0)
  - Auto-detected tags
  - New/updated character mentions
  - Soundtrack suggestion (genre + mood based)
- **Generation UX:** Beautiful loading animation — typewriter effect with ink drops, pages turning

#### 4.2.2 Chapter Regeneration
- User can regenerate with:
  - **Same entry, different style** — try a new genre/tone
  - **Edited entry** — modify the raw journal text and regenerate
  - **"Plot Twist" mode** — AI goes maximum dramatic
  - **"Alternate Universe"** — reimagine in a completely different genre (e.g., your work meeting as a medieval council)
- All versions saved in `chapter_versions` table
- User can switch between versions or revert

#### 4.2.3 Weekly / Monthly Summary Chapters
- **Weekly:** Auto-generated every Sunday (or user-configurable day)
  - Weaves together the week's themes, moods, character arcs
  - Styled as a "recap chapter" or "interlude"
- **Monthly:** Auto-generated on the 1st of each month
  - Broader narrative arc, character development highlights
  - "The month of [Month] was..." narrative style
- User can trigger manual generation anytime

#### 4.2.4 Volume System (Yearly)
- **Every calendar year = 1 volume**
- Volume auto-created on first entry of a new year
- AI generates:
  - **Volume title** (e.g., "Volume III: The Turning")
  - **Prologue** — written after ~2 weeks of entries, sets the stage
  - **Epilogue** — written after December 31 or user-triggered, summarizes the year's arc
  - **Volume cover** — dynamically generated based on the year's dominant themes

#### 4.2.5 Starting from Birth / Past Dates
- When creating a novel, user can set a custom start date (e.g., their birth date)
- User can write entries for any past date, not just today
- Entries are sorted by `entry_date`, not `created_at`
- Volumes auto-assign based on the entry's year

### 4.3 🎨 Dynamic Cover Page Generation

- **When generated:**
  - On novel creation (based on title + genre)
  - After every 10 chapters (evolves with the story)
  - On volume creation
  - Manual regeneration anytime
- **How:**
  - AI analyzes recent chapters → generates an image prompt
  - Image generation API creates the cover
  - Cover stored in Supabase Storage
- **Display:**
  - Shown on novel card in library
  - Full-screen cover page when opening a novel
  - Volume covers in the volume selector
- **Style:** Covers match the novel's genre — noir gets moody shadows, fantasy gets sweeping landscapes, etc.

### 4.4 🧑‍🤝‍🧑 Character Memory System

- AI automatically detects people mentioned in entries
- **Auto-extraction:** When user mentions someone (e.g., "talked to Sarah about work"), AI:
  1. Checks if character exists → updates `last_mentioned_at` and `mention_count`
  2. If new → creates character entry with `novel_name`, inferred `relationship`
- **Character Profiles Page:**
  - AI-generated profile card for each recurring character
  - Photo placeholder / AI-generated avatar
  - Personality traits (AI-inferred from mentions)
  - Relationship to protagonist
  - First appearance chapter
  - Mention count & trend
  - Key moments together
- **Continuity in chapters:**
  - AI receives character registry as context when generating chapters
  - Ensures consistent naming, personality, and relationship dynamics

### 4.5 📊 Life Stats Dashboard

- **Mood Arc Chart:** Line/area chart showing mood_score over time (days, weeks, months)
- **Top Characters:** Bar chart of most mentioned people
- **Theme Cloud:** Word cloud of recurring themes/tags
- **Genre of Your Life:** AI analyzes mood patterns and tells you what genre your life is trending toward
- **Writing Streak:** Current streak, longest streak, total entries
- **Chapter Stats:** Total chapters, total words, avg chapter length
- **Monthly Mood Summary:** Calendar heatmap colored by mood
- **AI Narrative Analysis:** Periodic AI-generated analysis of patterns in your life

### 4.6 🔍 Search & Organization

- **Full-text search** across all chapters (novel content + raw entries)
- **Tag system:**
  - AI auto-generates tags per chapter (e.g., #work, #travel, #heartbreak)
  - User can add/remove custom tags
  - Filter chapters by tag
- **Bookmarks:** Star/bookmark favorite chapters for quick access
- **Timeline view:** Scrollable timeline of all entries with mood indicators

### 4.7 ⏰ Time Machine

- "On This Day" feature — shows what happened on this date in previous years
- Accessible from home dashboard
- Shows the chapter title, opening quote, and mood
- Tap to read the full chapter
- Notification-worthy: "1 year ago, your Chapter 42 was titled 'The Quiet Before the Storm'"

### 4.8 💬 Quote Wall

- AI extracts the best/most poignant lines from each chapter
- User can also manually highlight and save quotes
- Displayed as a beautiful masonry grid of quote cards
- Each quote links back to its chapter
- Filterable by mood, tag, or time period

### 4.9 🌀 Alternate Universe Mode

- Available per chapter — "Reimagine this day"
- User picks a wildly different genre:
  - Medieval fantasy
  - Space opera
  - Film noir detective story
  - Superhero origin story
  - Horror / psychological thriller
  - Romantic comedy
  - Cyberpunk
- AI rewrites the chapter in that genre while keeping all real events
- Stored as a special chapter version

### 4.10 📤 Export System

- **Export as PDF:** Formatted like a real book — cover page, table of contents, chapters, volume breaks
- **Export as eBook (.epub):** For e-readers
- **Export single chapter** or **full novel**
- **Export by volume**

### 4.11 🔥 Streak & Engagement

- **Daily streak tracker:** Consecutive days with entries
- **Streak banner** on dashboard
- **Nightly reflection prompt:** AI asks a thought-provoking question based on your recent entries
  - e.g., "You've mentioned feeling uncertain about your career 3 times this week. What would your ideal Monday morning look like?"
- **"Plot Twist" mode toggle:** When enabled, AI dramatizes everything extra hard — turns your grocery shopping into a heist sequence

### 4.12 🎵 Soundtrack Suggestions

- After generating a chapter, AI suggests a song/genre that matches the mood
- Display: Small music note card at the end of each chapter
- Based on mood_score + genre + chapter themes
- Links to Spotify search (no API integration needed for MVP)

---

## 5. UI/UX Design Specification

### 5.1 Design System

#### Theme: "Leather Dark" (Default)

```
Primary Background:     #0D0B0E (near black, warm)
Secondary Background:   #1A1620 (dark plum-black)
Card Background:        #221E2A (dark leather purple)
Accent Primary:         #C4956A (warm amber/gold)
Accent Secondary:       #8B6914 (deep gold)
Text Primary:           #E8DFD0 (warm cream)
Text Secondary:         #9B8E7E (muted tan)
Text Muted:             #6B5F52 (dark tan)
Border:                 #2E2836 (subtle purple-gray)
Highlight:              #C4956A20 (amber glow, 12% opacity)
Error:                  #D4544A
Success:                #5B8C5A
Mood Positive:          #7AAE7A (sage green)
Mood Negative:          #AE7A7A (dusty rose)
Mood Neutral:           #7A8BAE (steel blue)
```

#### Typography

```
Display / Titles:       "Playfair Display" (serif, dramatic)
Body / Reading:         "Crimson Pro" (serif, comfortable reading)
UI / Labels:            "DM Sans" (clean sans-serif)
Monospace / Code:       "JetBrains Mono"
```

#### Spacing Scale (Tailwind)

```
Base unit: 4px
Tight:   4px  (p-1)
Small:   8px  (p-2)
Medium:  16px (p-4)
Large:   24px (p-6)
XLarge:  32px (p-8)
XXLarge: 48px (p-12)
```

### 5.2 Pre-built Themes

Users can switch between these or create custom themes:

| Theme Name | Vibe | Background | Accent |
|---|---|---|---|
| **Leather Dark** (default) | Dark moody journal | #0D0B0E | Amber gold |
| **Midnight Ink** | Deep blue-black | #0A0E1A | Silver blue |
| **Parchment** | Light aged paper | #F5F0E6 | Dark brown |
| **Forest Study** | Dark green cabin | #0B1210 | Moss green |
| **Rose Noir** | Dark romantic | #120A0E | Dusty rose |
| **Typewriter** | High contrast minimal | #FAFAFA | Pure black |

#### Custom Theme Builder
- User can set: background, card, accent, text colors
- Font pairing selection (5-6 curated pairings)
- Preview panel shows changes in realtime

### 5.3 Responsive Breakpoints (Mobile-First)

```
Mobile:     0 - 639px     (default styles)
Tablet:     640 - 1023px  (sm: prefix)
Desktop:    1024 - 1279px (lg: prefix)
Wide:       1280px+       (xl: prefix)
```

### 5.4 Key Screens

#### 5.4.1 Home / Library (Mobile)
```
┌─────────────────────────┐
│  🖋️ INKBOUND       [⚙️] │
│                         │
│  🔥 12 day streak!      │
│                         │
│  ┌─────────────────┐    │
│  │ [Cover Image]   │    │
│  │ My Life Novel    │    │
│  │ Ch. 42 · Vol II  │    │
│  │ Last: Yesterday  │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ [Cover Image]   │    │
│  │ Work Chronicles  │    │
│  │ Ch. 15 · Vol I   │    │
│  │ Last: 3 days ago │    │
│  └─────────────────┘    │
│                         │
│  [+ Create New Novel]   │
│                         │
│  ── On This Day ──      │
│  "The rain came down..." │
│  Feb 8, 2025 · Ch. 5    │
│                         │
├─────────────────────────┤
│ [🏠] [✍️] [🔍] [📊] [⚙️] │
└─────────────────────────┘
```

#### 5.4.2 Write Entry (Mobile)
```
┌─────────────────────────┐
│  ← What happened today? │
│                         │
│  Select your novel:     │
│  [My Life Novel    ▾]   │
│                         │
│  How do you want to     │
│  capture today?         │
│                         │
│  ┌───────┐ ┌──────────┐│
│  │ ✏️    │ │ 💬       ││
│  │ Free  │ │ Guided   ││
│  │ Write │ │ Chat     ││
│  └───────┘ └──────────┘│
│  ┌──────────────────┐  │
│  │ 📋 Structured    │  │
│  │    Prompts       │  │
│  └──────────────────┘  │
│                         │
│  ── Quick Options ──    │
│  [🌀 Plot Twist Mode]  │
│  [📅 Write for past    │
│      date instead]      │
│                         │
├─────────────────────────┤
│ [🏠] [✍️] [🔍] [📊] [⚙️] │
└─────────────────────────┘
```

#### 5.4.3 Reading Mode (Mobile)
```
┌─────────────────────────┐
│  ← My Life Novel   [⋮] │
│                         │
│     Chapter 42          │
│  "The Quiet Before      │
│   the Storm"            │
│                         │
│  ❝ Sometimes the most   │
│  ordinary days leave    │
│  the deepest marks. ❞   │
│                         │
│  ─────────────────      │
│                         │
│  The morning arrived    │
│  without ceremony, as   │
│  mornings often do in   │
│  the life of someone    │
│  who has grown          │
│  accustomed to the      │
│  weight of routine...   │
│                         │
│  [continues scrolling]  │
│                         │
│  ── End of Chapter ──   │
│                         │
│  🎵 "Holocene" — Bon    │
│     Iver                │
│                         │
│  Mood: 😌 Reflective    │
│  Tags: #routine #growth │
│                         │
│  [🔄 Regenerate]        │
│  [🌀 Alt Universe]      │
│  [🔖 Bookmark]          │
│                         │
│  [← Ch. 41] [Ch. 43 →] │
│                         │
├─────────────────────────┤
│ [🏠] [✍️] [🔍] [📊] [⚙️] │
└─────────────────────────┘
```

---

## 6. AI Prompt Architecture

### 6.1 Chapter Generation Prompt

```
SYSTEM:
You are a masterful novelist transforming real daily experiences into an
evolving novel. You write with the skill of a published author.

NOVEL CONTEXT:
- Title: "{title}"
- Protagonist name: "{character_name}"
- Genre/Tone: {genre}
- POV: {pov}
- Writing Style: {style}
- Current Chapter: {chapter_number}
- Current Volume: {volume_number} ({year})
- Date: {entry_date}

CHARACTER REGISTRY:
{JSON list of known characters with names, relationships, traits}

PLACE REGISTRY:
{JSON list of known places with descriptions}

RECENT CHAPTERS (for continuity):
{Last 3-5 chapter summaries with key events}

INSTRUCTIONS:
1. Transform the raw entry into a beautifully written novel chapter
2. Maintain the {genre} tone throughout
3. Write in {pov} point of view
4. Use "{character_name}" as the protagonist's name
5. Reference known characters by their novel names consistently
6. Weave in emotional undertones and subtext
7. Make mundane moments compelling through prose quality
8. Maintain narrative continuity with previous chapters
9. Chapter length: 500-1500 words based on entry richness
10. Include a chapter title
11. Include an opening epigraph/quote (original, thematic)

RESPOND IN JSON:
{
  "title": "Chapter title",
  "opening_quote": "An original thematic quote",
  "content": "Full chapter text...",
  "mood": "reflective|joyful|anxious|melancholic|excited|angry|peaceful|confused",
  "mood_score": 0.0,  // -1.0 to 1.0
  "tags": ["tag1", "tag2"],
  "new_characters": [{"name": "...", "relationship": "...", "traits": [...]}],
  "new_places": [{"name": "...", "description": "..."}],
  "soundtrack": {"song": "...", "artist": "...", "why": "..."},
  "best_quote": "The single best line from this chapter"
}

USER:
Here is what happened on {entry_date}:
{raw_entry}
```

### 6.2 Guided Conversation Prompt

```
SYSTEM:
You are a warm, curious journal companion helping someone capture their day.
Ask ONE question at a time. Be conversational, empathetic, and interested.
Adapt your questions based on what they share. Draw out details about
conversations (what was said), emotions (how they felt), and sensory details
(what they saw, heard, smelled). After 5-8 exchanges, offer to wrap up.
Never be pushy — if they say "that's it", respect it.
```

### 6.3 Alternate Universe Prompt

```
SYSTEM:
You are rewriting a real day's events in the style of {alt_genre}.
Keep ALL real events, people, and outcomes intact — but reimagine the
setting, descriptions, and narrative framing as if this day happened in
a {alt_genre} world. The protagonist's office becomes a {setting}.
Their coworker becomes a {archetype}. Their commute becomes a {journey_type}.
Be creative, funny, and immersive. This should be delightful to read.
```

---

## 7. API Routes Specification

| Route | Method | Purpose | Key Params |
|---|---|---|---|
| `/api/generate-chapter` | POST | Generate novel chapter from entry | `novelId`, `rawEntry`, `entryDate`, `plotTwist?` |
| `/api/generate-cover` | POST | Generate/update novel cover image | `novelId`, `chapterContext?` |
| `/api/generate-summary` | POST | Generate weekly/monthly summary chapter | `novelId`, `period`, `startDate`, `endDate` |
| `/api/generate-stats` | POST | Generate life stats analysis | `novelId`, `period` |
| `/api/generate-profiles` | POST | Generate/update character profiles | `novelId` |
| `/api/guided-chat` | POST | Next message in guided conversation | `novelId`, `messages[]` |
| `/api/alternate-universe` | POST | Reimagine chapter in different genre | `chapterId`, `altGenre` |
| `/api/export-pdf` | POST | Export novel/volume as PDF | `novelId`, `volumeId?`, `format` |
| `/api/reflection-prompt` | GET | Get nightly reflection question | `novelId` |

---

## 8. Build Phases

### Phase 1 — Core MVP (Week 1-2)

**Goal:** User can create a novel, write daily entries, and read AI-generated chapters.

- [ ] Project setup: Next.js 14 + TypeScript + Tailwind + Supabase
- [ ] Auth: Sign up / Login (email + Google OAuth)
- [ ] Database: Core tables (profiles, novels, volumes, chapters)
- [ ] Home screen: Novel library with cards
- [ ] Create novel flow: Title, character name, genre, POV, style selection
- [ ] Write entry: Free-form mode only
- [ ] AI chapter generation: Basic prompt, JSON response parsing
- [ ] Chapter reader: Beautiful reading mode
- [ ] Chapter list: Scrollable timeline per novel
- [ ] CRUD: Create, edit, delete entries and novels
- [ ] Volume auto-creation (by year)
- [ ] Mobile-first responsive layout
- [ ] Default "Leather Dark" theme
- [ ] Basic loading/generating animations

### Phase 2 — Rich Features (Week 3-4)

**Goal:** All input modes, character memory, search, and customization.

- [ ] AI-guided conversation mode
- [ ] Structured prompts mode
- [ ] Character memory system (auto-detect, registry, context injection)
- [ ] Places memory system
- [ ] Chapter regeneration (same entry / edited entry / different style)
- [ ] Tags system (AI auto-tag + user custom tags)
- [ ] Full-text search across chapters
- [ ] Bookmarks / favorites
- [ ] Weekly & monthly summary chapter generation
- [ ] Write for past dates
- [ ] Chapter versioning (edit history)
- [ ] Multiple themes (all 6 pre-built themes)
- [ ] Start from birth / custom start date

### Phase 3 — Magic Features (Week 5-6)

**Goal:** The wow factor — covers, stats, quotes, alternate universe.

- [ ] Dynamic cover page generation (AI image)
- [ ] Cover auto-evolution every 10 chapters
- [ ] Volume covers
- [ ] Life Stats dashboard (mood chart, top characters, theme cloud)
- [ ] AI character profile cards
- [ ] Quote wall (AI-extracted + user-picked)
- [ ] Time Machine ("On This Day")
- [ ] Alternate Universe mode
- [ ] Plot Twist mode toggle
- [ ] Soundtrack suggestions per chapter
- [ ] Nightly reflection prompt
- [ ] Writing streak tracker with banner
- [ ] Prologue & Epilogue per volume

### Phase 4 — Polish & Export (Week 7-8)

- [ ] Custom theme builder
- [ ] Export as PDF (book-formatted)
- [ ] Export as ePub
- [ ] Chapter illustrations (AI-generated)
- [ ] Performance optimization
- [ ] PWA support (installable on mobile)
- [ ] Notification support (streak reminders, nightly prompts)
- [ ] Onboarding flow for new users
- [ ] Error handling & edge cases
- [ ] Accessibility audit
- [ ] Final QA & polish

---

## 9. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Image Generation
OPENAI_API_KEY=                    # For DALL·E 3 covers
# OR
STABILITY_API_KEY=                 # For Stable Diffusion

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Inkbound
```

---

## 10. Key Design Principles

1. **Mobile-first, always.** Every feature is designed for thumb-zone interaction first, then expanded for desktop.
2. **The reading experience is sacred.** Chapter reading mode should feel like reading a Kindle — comfortable fonts, perfect line height, no distractions.
3. **AI is invisible.** The magic happens behind the scenes. User just "tells their day" and gets a novel chapter. No AI jargon.
4. **Privacy is absolute.** No sharing features. No analytics on content. Encrypted at rest. Your life stays yours.
5. **Delight in the details.** Ink drop animations, page-turn transitions, typewriter sounds (optional), warm glow effects.
6. **Every day is worth a chapter.** Even the most boring Tuesday becomes interesting prose. The AI's job is to find the story in the ordinary.

---

*Inkbound — Because every life deserves to be a novel.* 🖋️

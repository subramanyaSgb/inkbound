# Phase 3: Magic Features — Design

**Date:** 2026-02-13
**Status:** Approved
**Scope:** 4 features — Quote Wall, Alternate Universe, Tarot Character Cards, Dynamic Covers
**Build Order:** Quote Wall → Alternate Universe → Tarot Cards → Dynamic Covers

---

## Feature 1: Quote Wall

### Overview
Per-novel page displaying the best quotes from generated chapters in a masonry-style grid.

### Where it lives
- Route: `/novel/[novelId]/quotes`
- Accessed from novel detail page nav (alongside chapters, stats, search, settings)

### Data Sources
1. **Auto-collected:** `opening_quote` from chapters table (already populated by AI generation)
2. **User-saved:** New `saved_quotes` table for manually highlighted quotes from the chapter reader

### Database

```sql
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
```

### UI Design
- **Layout:** Masonry grid of quote cards (CSS columns or grid with varying heights)
- **Card content:** Quote text, chapter title + number, mood pill, entry date
- **Filters:** Mood dropdown, tag filter, date range
- **Interactions:** Click quote → navigate to chapter. Long-press/select in reader → save quote.
- **Empty state:** "No quotes yet — write your first chapter to see its opening quote here."

### Chapter Reader Integration
- Text selection in chapter reader shows a floating "Save Quote" button
- Saved quotes get a subtle bookmark icon when viewing that chapter

---

## Feature 2: Alternate Universe

### Overview
Reimagine any chapter in a wildly different genre while keeping all real events intact.

### Available Genres
- Medieval Fantasy
- Space Opera
- Film Noir
- Cyberpunk
- Romantic Comedy
- Horror / Psychological Thriller
- Superhero Origin Story

### Database

```sql
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
```

### API
- **Route:** `POST /api/generate-alternate`
- **Input:** `{ chapterId, genre }`
- **Process:**
  1. Fetch original chapter's `raw_entry`, novel metadata, story profiles
  2. Build genre-specific system prompt (e.g., "Rewrite this day as if it happened in a medieval kingdom...")
  3. Call NVIDIA API (Kimi K2.5) with genre prompt
  4. Parse JSON response (title, content, opening_quote, mood)
  5. Save to `alternate_chapters` table
- **Output:** `{ alternateChapterId }`

### Chapter Reader Changes
- **Tabs:** "Original" tab (default) + one tab per generated AU (e.g., "Medieval Fantasy")
- **"Reimagine" button:** Opens a genre selection modal. Generating shows the typewriter animation.
- **Multiple AU versions** can coexist per chapter — each genre gets its own tab.
- **Tab bar:** Scrollable horizontal tabs below the chapter header.

### Prompt Design
Each genre gets a tailored system prompt that:
- Keeps ALL real events, people, and emotions from the raw entry
- Transforms setting, language, and metaphors to match the genre
- Uses story profiles for character names (same strict no-invention rules)
- Produces the same JSON structure as regular chapters (title, content, opening_quote, mood)

---

## Feature 3: Tarot Character Cards

### Overview
Beautiful flip-card character profiles displayed in a grid on a dedicated characters page.

### Where it lives
- Route: `/novel/[novelId]/characters`
- Accessed from novel detail page nav

### Database Changes

```sql
-- Add to story_profiles table
ALTER TABLE story_profiles ADD COLUMN archetype TEXT;
ALTER TABLE story_profiles ADD COLUMN portrait_url TEXT;
ALTER TABLE story_profiles ADD COLUMN first_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE story_profiles ADD COLUMN mention_count INTEGER DEFAULT 0;
```

Migration file: `supabase/migrations/005_phase3_magic_features.sql` (combined for all Phase 3 tables)

### Card Design

**Front of card:**
- Portrait area: AI-generated tarot-style portrait OR styled initial with gradient background
- Name (large, display font)
- Archetype title: "The Anchor", "The Catalyst", "The Rival", "The Mirror", "The Sage", "The Storm", "The Light"
- Relationship label (e.g., "wife", "best friend")
- Mention count badge

**Back of card (flip on click/tap):**
- All `details` JSONB fields rendered (age, personality, appearance, occupation, quirks)
- Nickname (if set)
- First appearance: link to chapter
- Framer Motion flip animation (rotateY 180deg)

**Styled initials (default):**
- Large initial letter in display font
- Genre-matched gradient background (same `genreGradients` from NovelCard)
- Subtle tarot card border pattern via CSS

**AI portrait (upgrade button):**
- "Generate Portrait" button on card back
- Calls NVIDIA Picasso API with prompt: "Tarot card portrait of [name], [age], [appearance], [archetype], in mystical tarot art style, dark background with gold accents"
- Stored in Supabase Storage → URL saved to `portrait_url`
- Portrait replaces the styled initial on card front

### Archetype Assignment
- AI assigns archetype when a character reaches 3+ mentions
- Added to the chapter generation response: `new_characters[].archetype`
- Can also be manually overridden from the card back "Edit" button

### Page Layout
- Grid of cards: 1 column mobile, 2 tablet, 3 desktop
- Filter by type: Characters | Locations | Personal
- Sort: most mentioned, alphabetical, recently added
- Empty state: "Add characters in Settings → Story Profiles to see them here."

---

## Feature 4: Dynamic Covers

### Overview
AI-generated book covers based on the novel's title, genre, and themes.

### When Generated
- Manual "Generate Cover" button on novel settings page
- Future: auto-regenerate every 10 chapters (not in this build)

### Image Generation Flow
1. **Prompt building:** AI analyzes novel metadata → generates a detailed image prompt
   - Input: title, genre, writing style, recent chapter moods, top tags
   - Output: A detailed SDXL-style prompt (subject, style, mood, colors, composition)
2. **Image generation:** NVIDIA Picasso API (Stable Diffusion XL)
   - Endpoint: `https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl`
   - Output: 1024x1024 image
3. **Storage:** Upload to Supabase Storage bucket `covers/`
4. **Save:** Update `novels.cover_image_url` with the public URL

### API
- **Route:** `POST /api/generate-cover`
- **Input:** `{ novelId }`
- **Process:**
  1. Fetch novel metadata + recent chapter moods/tags
  2. Call NVIDIA text API to generate an image prompt
  3. Call NVIDIA Picasso API with the prompt
  4. Upload result to Supabase Storage
  5. Update novel record with cover URL
- **Output:** `{ coverUrl }`

### Supabase Storage Setup
- Bucket: `covers` (public read, authenticated write)
- Path: `covers/{userId}/{novelId}/{timestamp}.png`

### UI Changes
- **Novel settings page:** "Generate Cover" button with loading state
- **NovelCard:** Already wired — `cover_image_url` renders via `<Image>`
- **Novel detail page:** Full-width cover hero at top when cover exists
- **Cover preview:** Show current cover in settings with "Regenerate" option

### Genre-Specific Cover Styles
| Genre | Style Direction |
|-------|----------------|
| Literary | Minimalist, muted tones, single object symbolism |
| Romance | Warm golden light, soft focus, intimate scene |
| Thriller | Dark shadows, high contrast, urban landscape |
| Fantasy | Sweeping landscape, magical elements, rich colors |
| Sci-Fi | Futuristic cityscape, neon accents, space elements |
| Comedy | Bright, playful, whimsical illustration |
| Poetic | Abstract, watercolor texture, flowing forms |
| Noir | Black and white with single color accent, silhouettes |

---

## Combined Database Migration

All Phase 3 schema changes in one migration file: `supabase/migrations/005_phase3_magic_features.sql`

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

Note: Dynamic Covers uses the existing `novels.cover_image_url` column — no schema change needed. Supabase Storage bucket `covers` must be created manually.

---

## New Files Summary

| File | Purpose |
|------|---------|
| `supabase/migrations/005_phase3_magic_features.sql` | Combined migration |
| `app/(dashboard)/novel/[novelId]/quotes/page.tsx` | Quote wall page |
| `components/novel/QuoteCard.tsx` | Individual quote card |
| `components/novel/SaveQuoteButton.tsx` | Floating save button in reader |
| `app/api/generate-alternate/route.ts` | Alternate universe API |
| `lib/ai/alternate-prompts.ts` | Genre-specific AU prompt builders |
| `components/novel/AlternateTab.tsx` | AU tab bar + content for reader |
| `components/novel/GenrePickerModal.tsx` | Genre selection modal |
| `app/(dashboard)/novel/[novelId]/characters/page.tsx` | Tarot cards page |
| `components/novel/TarotCard.tsx` | Flip card component |
| `app/api/generate-cover/route.ts` | Cover generation API |
| `app/api/generate-portrait/route.ts` | Character portrait API |
| `lib/ai/cover-prompts.ts` | Cover prompt builder |

---

## Implementation Priority

1. **Quote Wall** (smallest, no external API)
2. **Alternate Universe** (new API + reader tabs)
3. **Tarot Character Cards** (new page + DB columns + optional image API)
4. **Dynamic Covers** (external image API + Supabase Storage)

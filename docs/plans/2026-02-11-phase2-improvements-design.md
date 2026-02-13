# Phase 2 Improvements Design

**Date:** 2026-02-11
**Status:** Approved
**Scope:** 5 features — entry editing, loading screen, smart profiles, mobile compact mode, PWA icons/splash

---

## Feature 1: Entry Edit & Chapter Regeneration

### Problem
After a user writes a journal entry and generates a chapter, they cannot go back to edit their raw entry or regenerate the chapter.

### Design

**Where it lives:** An "Edit Entry" button on the chapter reader page header (next to the back arrow).

**Flow:**
1. User reads a generated chapter and wants to change something
2. Taps "Edit Entry" → navigates to `/write/freeform?novelId={id}&chapterId={id}`
3. Freeform editor loads pre-filled with the saved `raw_entry` from the chapter record
4. User edits their text, taps "Regenerate Chapter"
5. Same generation API is called, but with the existing `chapterId` → the chapter row is **updated** (not inserted)
6. Loading screen shows (with the new typewriter animation)
7. User lands on the updated chapter

**Versioning:** Replace the old chapter. No version history — one entry = one chapter.

**Code changes:**
- **Freeform page** (`app/(dashboard)/write/freeform/page.tsx`): Accept `chapterId` query param. If present, fetch existing chapter's `raw_entry` and pre-fill editor. Button text changes to "Regenerate Chapter".
- **Generate API** (`app/api/generate-chapter/route.ts`): Accept optional `chapterId`. If provided, **update** the existing chapter row instead of creating a new one. Chapter number and volume stay the same.
- **ChapterReader** (`components/novel/ChapterReader.tsx`): Add "Edit Entry" icon button in header area.
- **Write store** (`stores/write-store.ts`): Add `editingChapterId` field.

---

## Feature 2: Enhanced Loading Screen (Typewriter Effect)

### Problem
The current loading screen shows a single pulsing dot and one random phrase. It's boring during the 10-20 second wait.

### Design

**Visual layout:**
- Full-screen dark overlay with backdrop blur (same base)
- Top: animated ink drop (keep existing pulsing circle)
- Center: **typewriter text area** — content types out letter by letter, pauses, fades out, next item starts
- Bottom: subtle "Crafting your chapter..." text

**Content pool (30+ items, shuffled each time):**

| Category | Examples |
|----------|----------|
| Writing facts | "Tolkien took 12 years to write Lord of the Rings" |
| Funny quotes | "'I can write better than anybody who can write faster...' — A.J. Liebling" |
| Motivational | "'Start writing, no matter what. The water does not flow until the faucet is turned on.' — Louis L'Amour" |
| Random trivia | "Octopuses have three hearts and blue blood" |
| Book facts | "The first novel ever written is 'The Tale of Genji' from 1010 AD" |

**Typewriter animation timing:**
- Each character appears every 40ms
- Cursor blink at end for 1.5 seconds
- Fade out over 0.5 seconds
- 0.3 second pause before next item
- Cycles through ~3-5 items during a typical 10-20s generation

**Code changes:**
- **GeneratingAnimation** (`components/write/GeneratingAnimation.tsx`): Complete rewrite with typewriter effect, content pool, and cycling logic.

---

## Feature 3: Smart Profile System + @ Mentions

### Problem
When a user mentions "my wife" in an entry, the AI invents a name, age, and other details. There's no way to tell the AI correct information about real people and places.

### Design

#### 3A: Profile Types (Global, in App Settings)

Three types of profiles, all managed in `/settings`:

| Type | Examples | Core Fields |
|------|----------|-------------|
| **Personal** | User's own info | Name, age, job, personality, appearance, habits, quirks |
| **Characters** | Wife, friends, family | Name, relationship, nickname, age, appearance, personality, key traits |
| **Locations** | Home, office, cafe | Name, type, description, significance |

**Database:** New table `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'character', 'location')),
  name TEXT NOT NULL,
  relationship TEXT,        -- for characters: wife, friend, brother, etc.
  nickname TEXT,            -- optional alias
  details JSONB DEFAULT '{}', -- flexible: age, appearance, personality, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profiles" ON profiles
  FOR ALL USING (auth.uid() = user_id);
```

#### 3B: @ Mentions in Editor

- While typing in the freeform editor, user can type `@` to trigger a dropdown
- Dropdown shows matching characters/locations from their profiles
- Selecting inserts a tagged reference: `@Priya`, `@Home`
- If user types `@something` that doesn't match → highlighted as unrecognized (different color)

#### 3C: AI Smart Detection + Questioning (Pre-Generation)

1. User clicks "Generate Chapter"
2. System scans entry for:
   - `@mentions` that are unrecognized
   - Relationship keywords ("my wife", "my boss", "our apartment") not matching any profile
3. For each unknown, shows a **tiered question modal**:

   **Basic (always shown):**
   - Name: [________]
   - Relationship: [prefilled from detected keyword]

   **Medium (expandable):**
   - Age, personality (a few words), how you usually refer to them

   **Detailed (optional expand):**
   - Appearance, occupation, key memories, quirks, novel nickname

4. User fills what they want → saved to `profiles` table permanently
5. "Skip" option → AI keeps it vague ("his wife" only, no invented details)

#### 3D: AI Prompt Integration

All profiles injected into the system prompt:
```
PERSONAL PROFILE:
- Protagonist: Subramanya, 27, software engineer...

CHARACTER PROFILES:
- Priya (wife): age 26, designer, warm personality, loves cooking...
- Raj (friend): childhood friend, lives in Bangalore...

LOCATION PROFILES:
- Home: 2BHK apartment in Hyderabad, cozy balcony with plants...

STRICT RULES:
- Use ONLY the details provided in profiles above
- NEVER invent names, ages, appearances, or personal details
- For unknown people, use relationship terms only ("his wife", "her friend")
- For unknown places, use generic descriptions only
```

**Code changes:**
- **New DB table:** `profiles` (migration SQL)
- **New types:** `Profile`, `ProfileType` in `types/index.ts`
- **Settings page** (`app/(dashboard)/settings/page.tsx`): Add Characters/Locations/Personal sections with add/edit/delete UI
- **FreeformEditor** (`components/write/FreeformEditor.tsx`): Add @ mention detection + dropdown
- **New component:** `ProfileQuestionModal` — tiered questioning for unknown references
- **Freeform page** (`app/(dashboard)/write/freeform/page.tsx`): Pre-generation scanning + modal trigger
- **Prompts** (`lib/ai/prompts.ts`): Inject profile data + strict rules into system prompt
- **New utility:** `lib/profile-scanner.ts` — scans entry text for relationship keywords and @ mentions

---

## Feature 4: Mobile Compact Mode (All Pages)

### Problem
The entire app feels like a desktop layout squeezed into a phone. Tested on Samsung S23 (393dp wide, 6.1" screen) — everything is oversized.

### Design

**Approach:** Use Tailwind responsive prefixes. Compact defaults for mobile, expand at `md:` (768px) and `lg:` (1024px). No JavaScript media queries.

#### Global Changes

| Element | Current | Mobile (default) | Desktop (md: up) |
|---------|---------|-------------------|-------------------|
| Page padding | `p-6` / `p-8` | `px-4 py-3` | `p-6` / `p-8` |
| Section spacing | `space-y-8` | `space-y-4` | `space-y-8` |
| Headings | `text-3xl`+ | `text-xl` | `text-3xl` |
| Body text | `text-lg` | `text-base` | `text-lg` |
| Card padding | `p-6` | `p-3` | `p-6` |
| Buttons | tall | `h-10 text-sm` | default |
| Bottom nav | current | tighter padding | current |

#### Chapter Reader Specific
- Title: `text-2xl` → `md:text-4xl`
- Paragraph: `text-base leading-relaxed` → `md:text-lg md:leading-[1.8]`
- Opening quote: smaller font, tighter margins on mobile
- Footer tags: smaller chips, tighter wrapping
- Nav buttons: full-width stacked on mobile, side-by-side on desktop

#### Dashboard / Novel Library
- Novel cards: 1 column mobile, 2 columns tablet+
- Header: tighter height, smaller text on mobile

#### Write Page
- Textarea: full-width, smaller padding on mobile
- Date picker + button: full-width stacked on mobile

**Code changes:**
- **ChapterReader** (`components/novel/ChapterReader.tsx`): Add responsive Tailwind classes
- **Dashboard layout** (`app/(dashboard)/layout.tsx`): Tighten mobile spacing
- **Novel cards** (`components/novel/NovelCard.tsx`): Responsive grid
- **All page files**: Audit and add mobile-first responsive classes
- **UI primitives** (`components/ui/*`): Ensure Button, Card, Input have compact mobile defaults
- **Write pages**: Stack elements on mobile

---

---

## Feature 5: PWA App Icon & Splash Screen

### Problem
Current app only has a basic `favicon.ico`. No PWA manifest, no HD app icons, no splash screen. When added to phone homescreen, it looks low quality and doesn't match the Leather Dark theme.

### Design

**App Icon:** Gold quill/pen on dark leather background (`#0D0B0E`). SVG-based, generated at multiple sizes.

**Icon sizes needed:**
- `icon-192.png` — Android homescreen
- `icon-512.png` — Android splash / PWA install
- `apple-touch-icon.png` (180x180) — iOS homescreen
- `favicon.svg` — Modern browsers (scalable)
- `favicon.ico` — Legacy fallback (32x32)

**Splash screen:** Dark background (`#0D0B0E`) with gold accent (`#C4956A`). Set via manifest `background_color` + `theme_color`. No custom splash images needed — PWA auto-generates from icon + colors.

**PWA Manifest (`app/manifest.ts`):**
```json
{
  "name": "Inkbound",
  "short_name": "Inkbound",
  "description": "Your life, bound in ink.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0D0B0E",
  "theme_color": "#0D0B0E",
  "icons": [...]
}
```

**Metadata updates:**
- Add `manifest` link to root layout metadata
- Add `theme-color` meta tag
- Add `apple-touch-icon` link
- Update `viewport` for mobile web app

**Code changes:**
- **New file:** `app/manifest.ts` — Next.js manifest route
- **New files:** `app/icon.svg`, `app/apple-icon.png` — Next.js metadata convention
- **Replace:** `app/favicon.ico` with proper icon
- **Update:** `app/layout.tsx` metadata — add theme_color, manifest link

---

## Implementation Priority

1. **PWA Icons & Splash** (Feature 5) — quick win, immediately visible on phone
2. **Mobile Compact Mode** (Feature 4) — fixes the most visible daily-use issue
3. **Enhanced Loading Screen** (Feature 2) — quick win, isolated component
4. **Entry Edit & Regenerate** (Feature 1) — important UX improvement
5. **Smart Profile System** (Feature 3) — largest feature, most new code

---

## Database Changes Summary

- New table: `story_profiles` (for Feature 3 — named to avoid conflict with existing `profiles` table)
- No changes to existing tables
- New migration file: `supabase/migrations/002_story_profiles.sql`

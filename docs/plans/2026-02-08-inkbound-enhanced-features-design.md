# Inkbound — Enhanced Features Design

**Date:** 2026-02-08
**Status:** Validated
**Builds on:** INKBOUND_PRD.md (v1.0)

---

## 1. Core Experience Hierarchy

Inkbound's features are prioritized around three pillars:

**Pillar 1 — The Magic Moment (front door):**
User writes about their day. AI generates a beautifully written novel chapter. This hooks people in the first 10 minutes.

**Pillar 2 — Deepening Engagement:**
Character system, relationship tracking, media tracking, stats. Features that reward continued use and make the novel richer over time.

**Pillar 3 — Immersion Layer:**
Reading mode skins (visual novel, comic), voice narration, tarot-style character cards, mind maps. Features that make the experience feel like more than a journal.

### Build Priority

**Now (initial build):**
- Chapter generation engine
- Free-form entry
- Adaptive guided conversation
- Speech-to-text input (Web Speech API, all modes)
- Simple media mentions log
- Character auto-detection
- Per-character alias toggle
- Reading progress with progress bar
- Offline read + write (PWA)
- File uploads (photos via AI vision, audio via transcription, others as attachments)
- Natural novel dialogue in chapters
- Image replacement system (any generated image)

**Later (post-launch):**
- Shared couples view (woven narrative)
- Rich media cards with pattern detection
- Tarot-style character cards (co-created)
- Mind maps (character relationships + theme connections)
- Reading mode skins (visual novel, comic)
- Full format regeneration (webnovel, comic, visual novel content)
- Voice narration with character voices
- Conversational voice input mode
- Voice notes throughout the day
- Voice cloning from user samples

---

## 2. Shared View / Couples System

### How It Works
- Users create a shared novel and invite a partner via email/link.
- Both write entries independently for the same days.
- Each person's entry generates their own chapter as normal (no extra cost).
- When both have written for the same date, a third **woven narrative** is auto-generated — an omniscient narrator who knows both perspectives.
- The woven version only generates once both entries exist for that date.

### Reading Experience
- Three tabs on shared chapters: **"Woven" (default) | "Your View" | "Their View"**
- Single-entry days (only one person wrote) display as a normal chapter with no tabs.
- Each user's individual novel still works independently.

### Privacy Within Sharing
- Raw journal entries are never visible to the partner — only the generated chapter output.
- Users can mark specific entries as "private" to exclude them from the woven narrative.
- The alias system works independently per user within shared novels.

### Data Model
- `shared_novels` join table linking two users to one novel.
- `shared_chapters` table linking two chapters (one per user) to one woven chapter.
- RLS policies ensure each user only sees their own raw entries.

---

## 3. Character System

### Auto-Detection
- AI identifies people mentioned in every entry during chapter generation.
- New characters auto-created with inferred name, relationship, and basic traits.
- Existing characters get `mention_count` and `last_mentioned_at` updated.
- Full character registry sent as AI context for every chapter generation.

### Co-Creation Nudges
- After a character reaches 3 mentions, the app prompts: "You've mentioned Sarah a few times. Want to tell me more about her?"
- Nudges are single questions, not forms. One at a time, spaced across sessions.
- Questions adapt based on what's missing: how you met, what they're like, your feelings toward them.
- User can dismiss or snooze. System works fine without any user input.

### Tarot-Style Character Cards

**Front of card:**
- AI-generated portrait in tarot art style
- Novel name (tap to reveal real name if alias is active)
- Archetype title — AI-assigned based on role in the story ("The Anchor", "The Catalyst", "The Rival", "The Mirror")
- Relationship label
- Mention count

**Back of card (flip interaction):**
- How you met
- Emotional bond indicator (love / respect / tension / complicated)
- Personality traits
- First appearance chapter link
- Key moments together
- "See full bio" button

**Full bio page:**
- Complete chapter appearance timeline
- Relationship evolution over time
- AI-generated narrative summary of this person's role in the story
- Custom fields — user picks field type (text, date, number, tag) and adds whatever they want
- All fields auto-fill from story content when possible, user can override

### Alias System
- Per-character `use_alias` boolean toggle.
- When enabled, all app surfaces use `novel_name`.
- Real name only visible on character card when explicitly tapped.
- Character info page shows both names with clear labeling.

---

## 4. Entry System & Adaptive Guided Conversation

### Three Input Modes
- **Free-form** — Open text editor, dump everything.
- **Guided conversation** — Chat with AI that asks questions.
- **Structured prompts** — Card-based sections (morning, events, feelings, etc.).

### Speech-to-Text
- Available in all three modes as a mic button.
- Uses Web Speech API — no server cost.
- Not a separate mode, just an input method layered on top.

### Adaptive Guided Conversation

The guided chat reads the room instead of following a fixed script.

**For vague/short responses:**
- AI digs deeper: "You mentioned meeting someone for lunch — who was it? What did you talk about?"
- Asks about specifics: location, what was said, sensory details, emotions.
- Gently persistent but respects "that's it" immediately.

**For rich/detailed responses:**
- AI asks lighter follow-ups: "Anything else about that?"
- Suggests uncovered areas: "You told me about work — how was the rest of your day?"
- Offers enhancement: "Want me to ask more about the conversation with Sarah?"

**"Enhance my entry" for pro users:**
- After a free-form dump, user taps "Enhance my entry."
- AI analyzes what's missing and asks targeted questions.
- Responses appended to raw entry before chapter generation.

### File Uploads
- Available in all three entry modes.
- **Photos** — AI vision describes them, details woven into chapter.
- **Audio recordings** — Transcribed and appended to entry text.
- **Other files (PDFs, docs)** — Attached for user reference, not AI-processed.
- All files stored in Supabase Storage, linked to the chapter.

---

## 5. Reading Experience

### Chapter Reading Mode
- Serif typography (Crimson Pro), comfortable line height.
- Proper novel dialogue with quotation marks and attribution.
- Chapter title, opening epigraph, mood indicator, tags.
- Soundtrack suggestion card at chapter end.
- Attached photos displayed as inline illustrations or end-of-chapter gallery.
- Previous/next chapter navigation, chapter list jump.

### Reading Progress
- App saves last opened chapter and scroll position per novel.
- "Continue reading" button on novel card in library.
- Visual progress bar on novel card showing chapters read vs total.
- Progress syncs across devices.

### Reading Mode Skins
- **Novel (default)** — Standard prose layout.
- **Visual novel skin** — Dialogue sections get character portrait labels, styled speech blocks. Same content, different presentation.
- **Comic skin** — Text in panel-like blocks over chapter illustration. Speech in bubble-styled containers.

Skins are a presentation layer only — no content regeneration. User toggles freely.

### Cover Progression
- Cover generates on novel creation.
- Auto-regenerates every 10 chapters reflecting evolving themes.
- Volume covers generated per year.
- User can manually regenerate or replace any cover.

### Image Management
- Any AI-generated image in the app can be replaced.
- Three options: regenerate with new prompt, edit existing prompt and regenerate, upload own image.
- Original generated images kept in version history.

### Offline (PWA)
- Previously loaded chapters cached for offline reading.
- Users can write new entries offline — queued and synced when back online.
- Chapter generation triggers automatically on reconnection.
- Service worker handles caching and sync queue.

---

## 6. Media Tracking

### Now — Simple Mentions Log
- AI auto-detects mentions of movies, TV shows, books, games, music in entries.
- Running log: title, type, chapter referenced, one-line context.
- Accessible from a dedicated "Media" tab in novel navigation.

### Later — Rich Media Cards
- Auto-fetched metadata (poster image, genre, year).
- Pattern detection: "You binge-watch thrillers when stressed."
- AI insights connecting media habits to mood and life events.

---

## 7. Mind Maps

### Character Relationship Map
- Network graph with the user at center.
- Lines connect characters to user and to each other (when co-mentioned).
- Line thickness = frequency of interaction.
- Line color/style = relationship type (family, friend, work, romantic).
- Tappable nodes open the character's tarot card.
- Lives on Characters page as alternate view to card grid.

### Theme Connection Map
- Nodes are recurring themes/tags (work, love, anxiety, travel).
- Connected to chapters where they appear.
- Connected to characters associated with them.
- Clusters reveal patterns: "work stress" clusters with "Marcus" and "insomnia."
- Lives on Stats page as a visualization.

---

## 8. Life Stats Dashboard

- Mood arc chart over time (days, weeks, months).
- Top characters bar chart.
- Theme cloud (word cloud of tags).
- "Genre of your life" — AI analysis of what genre recent weeks resemble.
- Writing streak tracker with banner.
- Chapter and word count stats.
- Monthly mood calendar heatmap.
- Media log summary — what you consumed this month.
- AI narrative analysis of patterns.

---

## 9. Dialogue in Chapters

- AI writes natural novel dialogue with quotation marks, attribution, and beats when entries mention conversations.
- In default novel reading mode, dialogue is inline prose.
- In visual novel reading skin, dialogue sections get character portraits and styled speech blocks.
- No separate dialogue mode — it's handled by the AI's writing quality and the reading skin presentation.

---

## 10. Multi-Format Output

### Now — Reading Mode Skins
- Same chapter content presented differently per skin.
- Novel, visual novel, and comic skins as described in Section 5.
- Zero additional AI cost — purely a frontend presentation layer.

### Later — Full Format Regeneration (Premium)
- AI rewrites chapters specifically for webnovel format (shorter paragraphs, cliffhangers).
- AI generates panel-by-panel comic scripts with image prompts.
- AI creates branching visual novel dialogue with character sprites.
- Each format is a distinct regeneration — stored as a chapter version.

---

## 11. Future Roadmap (Parked)

Features agreed as valuable but not part of initial build:

**Voice & Audio:**
- Conversational voice mode (spoken guided conversation with AI)
- Voice notes (record clips throughout the day, AI processes at night)
- Narrator feature (TTS with different voice profiles per character)
- Voice cloning (user provides samples, AI generates character voices)

**Rich Media Cards:**
- Auto-fetched metadata, pattern detection, AI insights

**Full Format Regeneration:**
- Webnovel, comic script, visual novel — distinct AI regenerations per format

---

## 12. Data Model Additions

New tables beyond the original PRD schema:

```sql
-- Shared novels (couples feature)
CREATE TABLE shared_novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  user_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(novel_id)
);

-- Shared chapters (woven narratives)
CREATE TABLE shared_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_novel_id UUID REFERENCES shared_novels(id) ON DELETE CASCADE NOT NULL,
  chapter_user_a UUID REFERENCES chapters(id) ON DELETE SET NULL,
  chapter_user_b UUID REFERENCES chapters(id) ON DELETE SET NULL,
  woven_chapter UUID REFERENCES chapters(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shared_novel_id, entry_date)
);

-- Media mentions
CREATE TABLE media_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'movie', 'tv', 'book', 'game', 'music'
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments
CREATE TABLE entry_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'audio', 'document'
  file_name TEXT,
  ai_description TEXT, -- AI vision/transcription output
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character nudges tracking
CREATE TABLE character_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'answered', 'dismissed', 'snoozed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading progress
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  last_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  scroll_position FLOAT DEFAULT 0,
  chapters_read INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);
```

**Modifications to existing tables:**

```sql
-- Add to characters table
ALTER TABLE characters ADD COLUMN use_alias BOOLEAN DEFAULT false;
ALTER TABLE characters ADD COLUMN archetype TEXT; -- 'The Anchor', 'The Catalyst', etc.
ALTER TABLE characters ADD COLUMN emotional_bond TEXT; -- 'love', 'respect', 'tension', 'complicated'
ALTER TABLE characters ADD COLUMN how_met TEXT;
ALTER TABLE characters ADD COLUMN custom_fields JSONB DEFAULT '{}';
ALTER TABLE characters ADD COLUMN portrait_url TEXT;

-- Add to chapters table
ALTER TABLE chapters ADD COLUMN is_woven BOOLEAN DEFAULT false;
ALTER TABLE chapters ADD COLUMN is_private BOOLEAN DEFAULT false;
ALTER TABLE chapters ADD COLUMN reading_skin TEXT DEFAULT 'novel'; -- 'novel', 'visual_novel', 'comic'

-- Add to novels table
ALTER TABLE novels ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- Add to profiles table
ALTER TABLE profiles ADD COLUMN last_read JSONB DEFAULT '{}'; -- {novel_id: {chapter_id, scroll_position}}
```

---

*This document extends INKBOUND_PRD.md with all validated feature designs from the brainstorming session.*

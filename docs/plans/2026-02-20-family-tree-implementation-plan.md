# Family Tree & Social Graph — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Family Tree & Social Graph feature that lets users map relationships between people, and feeds the full relationship graph into AI chapter generation.

**Architecture:** New `profile_relationships` edge table links existing `story_profiles` to each other. A new Settings section renders blood relatives as a top-down tree and social connections as grouped cards. The AI prompt builder traverses the graph to produce relationship-aware context.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres + RLS), Framer Motion, Lucide React

**Design Doc:** `docs/plans/2026-02-20-family-tree-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/006_family_tree.sql`

**Step 1: Write the migration**

```sql
-- Family Tree: profile_relationships edge table
CREATE TABLE profile_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_profile_id UUID REFERENCES story_profiles(id) ON DELETE CASCADE NOT NULL,
  to_profile_id UUID REFERENCES story_profiles(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'parent', 'sibling', 'spouse', 'friend', 'colleague', 'mentor'
  )),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_profile_id, to_profile_id, relationship_type)
);

CREATE INDEX idx_profile_relationships_user ON profile_relationships(user_id);
CREATE INDEX idx_profile_relationships_from ON profile_relationships(from_profile_id);
CREATE INDEX idx_profile_relationships_to ON profile_relationships(to_profile_id);

ALTER TABLE profile_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own relationships"
  ON profile_relationships FOR ALL
  USING (auth.uid() = user_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/006_family_tree.sql
git commit -m "feat: add profile_relationships migration for family tree"
```

---

### Task 2: Types & Constants

**Files:**
- Modify: `types/index.ts` (add `ProfileRelationship` interface after `StoryProfile`)
- Modify: `lib/constants.ts` (add relationship type constants)

**Step 1: Add TypeScript types**

Add to `types/index.ts` after the `StoryProfile` interface:

```typescript
export type RelationshipType = 'parent' | 'sibling' | 'spouse' | 'friend' | 'colleague' | 'mentor'

export interface ProfileRelationship {
  id: string
  user_id: string
  from_profile_id: string
  to_profile_id: string
  relationship_type: RelationshipType
  label: string | null
  created_at: string
}
```

**Step 2: Add relationship constants**

Add to `lib/constants.ts`:

```typescript
export const RELATIONSHIP_TYPES = [
  { value: 'parent', label: 'Parent', description: 'Mother or father', category: 'family' },
  { value: 'sibling', label: 'Sibling', description: 'Brother or sister', category: 'family' },
  { value: 'spouse', label: 'Spouse', description: 'Husband, wife, or partner', category: 'family' },
  { value: 'friend', label: 'Friend', description: 'Close friend', category: 'social' },
  { value: 'colleague', label: 'Colleague', description: 'Coworker or professional contact', category: 'social' },
  { value: 'mentor', label: 'Mentor', description: 'Teacher, guide, or role model', category: 'social' },
] as const

export const RELATIONSHIP_INVERSE_MAP: Record<string, string> = {
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  spouse: 'spouse',
  friend: 'friend',
  colleague: 'colleague',
  mentor: 'mentee',
  mentee: 'mentor',
}

export const SOCIAL_CATEGORIES = ['friend', 'colleague', 'mentor'] as const
export const FAMILY_CATEGORIES = ['parent', 'sibling', 'spouse'] as const
```

**Step 3: Commit**

```bash
git add types/index.ts lib/constants.ts
git commit -m "feat: add ProfileRelationship types and relationship constants"
```

---

### Task 3: Relationship CRUD Helpers

**Files:**
- Create: `lib/relationships.ts`

**Step 1: Write CRUD utility functions**

These are thin wrappers around Supabase calls, used by UI components. Pattern matches existing inline Supabase usage but extracted since multiple components need them.

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { ProfileRelationship } from '@/types'

export async function fetchRelationships(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRelationship[]> {
  const { data, error } = await supabase
    .from('profile_relationships')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function addRelationship(
  supabase: SupabaseClient,
  userId: string,
  fromProfileId: string,
  toProfileId: string,
  relationshipType: string,
  label?: string
): Promise<ProfileRelationship> {
  const { data, error } = await supabase
    .from('profile_relationships')
    .insert({
      user_id: userId,
      from_profile_id: fromProfileId,
      to_profile_id: toProfileId,
      relationship_type: relationshipType,
      label: label || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRelationship(
  supabase: SupabaseClient,
  id: string,
  updates: { relationship_type?: string; label?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('profile_relationships')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteRelationship(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('profile_relationships')
    .delete()
    .eq('id', id)
  if (error) throw error
}
```

**Step 2: Commit**

```bash
git add lib/relationships.ts
git commit -m "feat: add relationship CRUD helpers"
```

---

### Task 4: Add Relationship Modal

**Files:**
- Create: `components/settings/AddRelationshipModal.tsx`

**Step 1: Build the modal component**

A modal for adding/editing a relationship between two existing `story_profiles`. Fields:
- "From" person (dropdown of existing profiles, pre-selected if adding from a tree node)
- "To" person (dropdown, filtered to exclude "From" person)
- Relationship type (dropdown from `RELATIONSHIP_TYPES`)
- Custom label (optional text input)

Follow the pattern from existing modals in the app:
- Use `Modal` from `@/components/ui/Modal`
- Use `Button`, `Input` from `@/components/ui`
- Lucide icons for visual cues
- Glass card styling

Props interface:
```typescript
interface AddRelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  profiles: StoryProfile[]
  userId: string
  preselectedFromId?: string  // when adding from a tree node
  editingRelationship?: ProfileRelationship | null
}
```

Key behaviors:
- On save: call `addRelationship()` or `updateRelationship()` from `lib/relationships.ts`
- On success: call `onSave()` callback (parent re-fetches data)
- Show error toast on failure
- Validate: from !== to, relationship_type is selected

**Step 2: Commit**

```bash
git add components/settings/AddRelationshipModal.tsx
git commit -m "feat: add AddRelationshipModal component"
```

---

### Task 5: Family Tree Visualization Component

**Files:**
- Create: `components/settings/FamilyTreeView.tsx`

**Step 1: Build the tree visualization**

A pure CSS/HTML tree (no external graph library) that renders blood relatives in a top-down hierarchy. Uses flexbox for layout and SVG or CSS borders for connecting lines.

Props:
```typescript
interface FamilyTreeViewProps {
  protagonist: StoryProfile | null
  profiles: StoryProfile[]
  relationships: ProfileRelationship[]
  onAddRelative: (fromProfileId: string) => void
  onEditProfile: (profile: StoryProfile) => void
}
```

Tree layout logic:
1. Find protagonist (`type === 'personal'`)
2. From `relationships`, find protagonist's parents (edges where `to = protagonist` and `type = parent`)
3. Find protagonist's siblings (edges where `type = sibling`)
4. Find protagonist's spouse (edges where `type = spouse`)
5. Find protagonist's children (edges where `from = protagonist` and `type = parent`)
6. For parents, find THEIR parents (grandparents) and siblings (aunts/uncles)

Each node renders:
- Circle with initials (or `portrait_url` if exists) — reuse the avatar pattern from `TarotCard`
- Name below circle
- Relationship label in muted text
- Small "+" button to add a connected relative

Connecting lines:
- Vertical line from parent to child
- Horizontal line between siblings
- Dotted line between spouses

Use Tailwind for styling:
- `bg-ink-surface/30 border border-ink-border/30 rounded-full` for nodes
- `border-accent-primary/40` for connecting lines
- `hover:border-accent-primary hover:shadow-glow-sm` for interactive states

Mobile: wrap in a `overflow-x-auto` container with horizontal scroll.

**Step 2: Commit**

```bash
git add components/settings/FamilyTreeView.tsx
git commit -m "feat: add FamilyTreeView visualization component"
```

---

### Task 6: Social Circle Grid Component

**Files:**
- Create: `components/settings/SocialCircleGrid.tsx`

**Step 1: Build the social circle card grid**

Displays non-family relationships (friends, colleagues, mentors) in grouped card sections.

Props:
```typescript
interface SocialCircleGridProps {
  profiles: StoryProfile[]
  relationships: ProfileRelationship[]
  protagonistId: string
  onAddPerson: (category: string) => void
  onEditRelationship: (relationship: ProfileRelationship) => void
  onDeleteRelationship: (id: string) => void
}
```

Layout:
- Group relationships by `relationship_type` (friend, colleague, mentor)
- Each group: heading + card grid (2 cols on mobile, 3 on desktop)
- Each card: `Card variant="glass" compact` with:
  - Name (from linked `story_profile`)
  - Relationship type badge
  - Custom label in muted text
  - Nickname if present
  - Edit/Delete icon buttons
- "Add" button per category (uses `Plus` icon from Lucide)
- Empty state: muted text "No friends added yet" etc.

Follow the card grid pattern from `StoryProfileSection.tsx`.

**Step 2: Commit**

```bash
git add components/settings/SocialCircleGrid.tsx
git commit -m "feat: add SocialCircleGrid component"
```

---

### Task 7: Family Tree Settings Section

**Files:**
- Create: `components/settings/FamilyTreeSection.tsx`
- Modify: `app/(dashboard)/settings/page.tsx`

**Step 1: Build the container component**

`FamilyTreeSection` is the orchestrator — fetches profiles + relationships, manages modal state, renders `FamilyTreeView` + `SocialCircleGrid` + `AddRelationshipModal`.

```typescript
'use client'

// Fetches story_profiles and profile_relationships for current user
// Manages state: isModalOpen, preselectedFromId, editingRelationship
// Renders:
//   1. FamilyTreeView (top)
//   2. SocialCircleGrid (bottom)
//   3. AddRelationshipModal (overlay)
```

Data flow:
- `useEffect` on mount: fetch user via `supabase.auth.getUser()`, then fetch profiles + relationships
- Pass data down to child components
- On modal save: re-fetch both profiles and relationships
- On delete: call `deleteRelationship()`, re-fetch

**Step 2: Add to Settings page**

In `app/(dashboard)/settings/page.tsx`, add a new `<motion.div>` block after the Story Profiles card:

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.15 }}
>
  <Card variant="glass">
    <div className="flex items-center gap-2 mb-4">
      <GitBranch className="w-5 h-5 text-accent-primary" />
      <h2 className="text-lg font-display font-semibold text-ink-text">Family Tree & Social Circle</h2>
    </div>
    <FamilyTreeSection />
  </Card>
</motion.div>
```

Add imports: `GitBranch` from lucide-react, `FamilyTreeSection` from `@/components/settings/FamilyTreeSection`.

**Step 3: Commit**

```bash
git add components/settings/FamilyTreeSection.tsx app/(dashboard)/settings/page.tsx
git commit -m "feat: integrate Family Tree section into Settings page"
```

---

### Task 8: AI Prompt Integration

**Files:**
- Modify: `lib/ai/prompts.ts`
- Modify: `app/api/generate-chapter/route.ts`

**Step 1: Add `buildRelationshipContext()` to prompts.ts**

New function that takes `StoryProfile[]` and `ProfileRelationship[]`, traverses the graph, and returns a structured text block for the AI.

```typescript
export function buildRelationshipContext(
  profiles: StoryProfile[],
  relationships: ProfileRelationship[]
): string
```

Logic:
1. Find protagonist (`type === 'personal'`)
2. Build adjacency map from relationships (both directions, using `RELATIONSHIP_INVERSE_MAP`)
3. Render "Family Tree:" section — walk from protagonist outward through family edges (parent, sibling, spouse, child), rendering indented lines showing who is related to whom
4. Render "Social Circle:" section — list friend/colleague/mentor connections with labels
5. For profiles with NO edges, fall back to existing format: `- Name (relationship): details`
6. Append the RELATIONSHIP RULES block

Output format matches the design doc:
```
CHARACTER & RELATIONSHIP REFERENCE:

Protagonist: Name (you)

Family Tree:
- Father (your father, age X, occupation)
  - married to Mother (your mother, age Y)
  - sibling: Aunt (your aunt, age Z)

Social Circle:
- Friend (friend, "custom label", occupation)

Unconnected:
- OldContact (acquaintance): age X

RELATIONSHIP RULES:
- Use the relationship graph above to understand how characters relate to EACH OTHER
- When the protagonist mentions "mom and aunt arguing", understand they are siblings
- Refer to characters by their names or the protagonist's natural way of addressing them
- NEVER invent relationships not listed above
```

**Step 2: Update `buildChapterPrompt()` to use relationship context**

Modify the function signature to accept an optional `relationships` parameter:

```typescript
export function buildChapterPrompt(
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  chapterNumber: number,
  volumeNumber: number,
  year: number,
  recentChapters: Pick<Chapter, 'title' | 'content' | 'mood' | 'chapter_number'>[],
  storyProfiles: StoryProfile[] = [],
  editInstruction?: string,
  relationships?: ProfileRelationship[]  // NEW PARAM
): { system: string; user: string }
```

Inside the function:
- If `relationships` is provided and non-empty, call `buildRelationshipContext(storyProfiles, relationships)` and use its output instead of the existing flat profile list
- If no relationships, fall back to the existing flat list (backward compatible)

**Step 3: Update generate-chapter API route**

In `app/api/generate-chapter/route.ts`, after fetching `storyProfiles`, also fetch relationships:

```typescript
const { data: relationships } = await supabase
  .from('profile_relationships')
  .select('*')
  .eq('user_id', user.id)
```

Pass `relationships` as the new parameter to `buildChapterPrompt()`.

**Step 4: Also update generate-alternate route**

Check `app/api/generate-alternate/route.ts` — if it also calls `buildChapterPrompt`, add the same relationship fetch and pass-through.

**Step 5: Commit**

```bash
git add lib/ai/prompts.ts app/api/generate-chapter/route.ts app/api/generate-alternate/route.ts
git commit -m "feat: integrate relationship graph into AI chapter generation prompts"
```

---

### Task 9: Build Verification & Polish

**Files:**
- All files from tasks 1–8

**Step 1: Run the build**

```bash
npm run build
```

Expected: Build passes with zero errors.

**Step 2: Fix any TypeScript or build errors**

Address any import issues, missing types, or lint errors.

**Step 3: Test the full flow manually**

1. Run migration 006 in Supabase SQL Editor
2. Go to Settings → Family Tree section
3. Add a few family members (parent, sibling, spouse)
4. Add a social connection (friend)
5. Verify tree renders correctly
6. Write a journal entry mentioning family members
7. Generate a chapter — verify AI uses relationship context

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: build fixes and polish for family tree feature"
```

---

## Task Dependency Graph

```
Task 1 (migration) ─────────────────────────────────────┐
Task 2 (types + constants) ──────────────────────────────┤
                                                         ▼
Task 3 (CRUD helpers) ──► Task 4 (modal) ──► Task 7 (settings integration)
                     ──► Task 5 (tree view) ──► Task 7
                     ──► Task 6 (social grid) ──► Task 7
                                                         │
Task 8 (AI prompts) ◄───────────────────────────────────┘
                                                         │
Task 9 (verification) ◄─────────────────────────────────┘
```

**Parallelizable:** Tasks 4, 5, 6 can be built in parallel after Tasks 1–3.
**Sequential:** Task 7 depends on 4+5+6. Task 8 depends on 2+3. Task 9 is last.

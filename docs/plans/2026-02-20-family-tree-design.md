# Family Tree & Social Graph — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Phase:** 4+

## Overview

A Family Tree & Social Graph feature that lets users manually map out their family (tree view) and social circle (card groups), stores inter-person relationships via a new edge table, and feeds the full relationship graph into AI chapter generation so the AI understands who everyone is — to the protagonist AND to each other.

## Problem

Today, `story_profiles` stores each person with a `relationship` field that only describes their relationship **to the protagonist**. The AI sees a flat list:

```
- Ravi (father): age 58
- Lakshmi (mother): age 55
- Meera (aunt): age 52
```

But has no idea that Meera is Ravi's sister, or that Lakshmi is Ravi's wife. When the user writes "Mom and aunt were arguing again," the AI doesn't understand they're siblings — it treats them as unrelated people.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Global (user-level) | Matches existing `story_profiles` scoping — one tree shared across all novels |
| Relationship types | Full social graph | Family + friends + colleagues + mentors + custom |
| Data model | Edge table (`profile_relationships`) | Clean graph model, queryable, referential integrity |
| Visualization | Traditional tree + side card lists | Family tree for blood relatives, card grids for social circle |
| AI integration | Full relationship context | AI gets the complete graph with inter-person relationships |
| Navigation | Under Settings page | New tab alongside existing profile management |

## Data Model

### New Table: `profile_relationships`

```sql
CREATE TABLE profile_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_profile_id UUID REFERENCES story_profiles(id) ON DELETE CASCADE NOT NULL,
  to_profile_id UUID REFERENCES story_profiles(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_profile_id, to_profile_id, relationship_type)
);

-- RLS
ALTER TABLE profile_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own relationships"
  ON profile_relationships FOR ALL
  USING (auth.uid() = user_id);
```

### Relationship Types & Inverse Mapping

Relationships stored one direction; inverse auto-derived:

| Stored | Inverse |
|---|---|
| `parent` | `child` |
| `sibling` | `sibling` |
| `spouse` | `spouse` |
| `friend` | `friend` |
| `colleague` | `colleague` |
| `mentor` | `mentee` |

Constants defined in code with a `RELATIONSHIP_INVERSE_MAP`.

### No Changes to `story_profiles`

The existing `relationship` field (to protagonist) stays for backward compat. The edge table adds inter-person relationships on top.

## UI Design

### Location

New **"Family Tree"** tab under the Settings page, alongside "Profile" and "Story Profiles."

### Layout: Two Zones

**Zone 1: Family Tree (top half)**
- Top-down tree for blood relatives (parent, child, sibling, spouse)
- Protagonist at root center
- Parents above, siblings beside, children below, grandparents further up
- Each node: avatar circle (initials or portrait_url) + name + relationship label
- Solid lines for parent-child, dotted lines for spouse
- Click node to expand/edit
- "Add relative" button on each node to add connected family members

**Zone 2: Social Circle Cards (bottom half)**
- Card grid grouped by category: Friends, Colleagues, Mentors, Other
- Each card: name, relationship label, nickname, custom label
- "Add person" button per category
- Cards link to existing `story_profiles`

### Add/Edit Relationship Modal

- Name, Nickname (from story_profiles)
- Relationship type dropdown
- "Connected to" — pick existing person to define relationship
- Optional: age, personality, appearance (reuses `details` fields)
- Optional: custom label ("college roommate", "neighbor since 2018")

### Mobile

- Tree: horizontal scrollable with pinch-to-zoom
- Social circle: vertical card stack
- Add/edit: drawer-style modal (consistent with app)

## AI Integration

### Updated Prompt Structure

The `buildChapterPrompt()` output changes from a flat list to:

```
CHARACTER & RELATIONSHIP REFERENCE:

Protagonist: Subramanya (you)

Family Tree:
- Ravi (your father, age 58, retired engineer)
  - married to Lakshmi (your mother, age 55, homemaker)
  - sibling: Meera (your aunt, age 52, teacher)
- Priya (your wife, age 28, designer)
  - her father: Kumar (your father-in-law, age 60)

Social Circle:
- Arjun (friend, "best friend since college", software engineer)
- Deepa (colleague, team lead at work)

RELATIONSHIP RULES:
- Use the relationship graph above to understand how characters relate to EACH OTHER
- When the protagonist mentions "mom and aunt arguing", understand they are siblings
- Refer to characters by their names or the protagonist's natural way of addressing them
- NEVER invent relationships not listed above
```

### Implementation

1. New utility `buildRelationshipContext()` — queries edges + profiles, traverses graph, outputs structured text
2. Update `buildChapterPrompt()` — replace flat profile list with relationship-aware block
3. Fallback: profiles without edges still appear with their `relationship` field

### Token Cost

~200-400 tokens for 10-20 people. Well within budget.

## New/Changed Files

| Area | Files |
|---|---|
| Migration | `supabase/migrations/006_family_tree.sql` |
| Types | `types/index.ts` — `ProfileRelationship` interface, relationship constants |
| Constants | `lib/constants.ts` — relationship types, inverse map, categories |
| Settings UI | New "Family Tree" tab in settings page |
| Components | `FamilyTreeView`, `SocialCircleGrid`, `AddRelationshipModal` |
| AI Prompts | `lib/ai/prompts.ts` — `buildRelationshipContext()`, updated `buildChapterPrompt()` |
| API/Data | CRUD for `profile_relationships` (Supabase client calls) |

## Out of Scope

- No auto-detection of relationships from journal entries (manual only)
- No drag-and-drop tree rearrangement
- No portrait generation for tree nodes (reuses existing `portrait_url`)
- No changes to existing Characters/Tarot page
- No import/export of tree data

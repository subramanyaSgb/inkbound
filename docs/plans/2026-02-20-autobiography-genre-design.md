# Autobiography Genre Design

**Date:** 2026-02-20
**Status:** Approved

## Summary

Add "Autobiography" as a new genre option in the novel creation flow. When selected, the AI writes chapters as lightly enhanced memoir prose — truthful to events, beautifully written, no fictionalization.

## Changes

### 1. Genre constant (`lib/constants.ts`)
Add `{ value: 'autobiography', label: 'Autobiography', description: 'Truthful, beautifully written memoir' }` to the GENRES array.

### 2. Genre type (`types/index.ts`)
Add `'autobiography'` to the Genre union type.

### 3. AI prompt (`lib/ai/prompts.ts`)
When genre is `autobiography`, the system prompt shifts from fiction mode to memoir mode:

- **Role:** "beautifully written memoir" instead of "evolving novel"
- **Truthfulness:** "Do NOT fictionalize events or invent scenes, dialogue, or details not in the entry"
- **Enhancement:** Enhance prose quality, not the events themselves
- **Reflection:** Use introspection and personal reflection to add depth
- **Dialogue:** Only include dialogue if the user explicitly describes a conversation
- **Tone:** Honest, reflective, published-memoir quality

All other prompt behavior (continuity, mood, tags, JSON response) remains the same.

### No changes needed
- Database schema (genre is a text field, not an enum)
- Novel creation UI (new genre just appears in the grid)
- Chapter generation API, reader, or any other features

## Scope
3 files, ~20 lines of changes.

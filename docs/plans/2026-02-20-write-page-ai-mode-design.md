# Write Page Redesign — AI Mode + Structured Prompts Update

**Date:** 2026-02-20
**Status:** Approved

## Summary

Redesign the write mode selection page to separate Free Write from two AI-assisted modes. Add a new chat-bubble AI Conversation page and update structured prompts to match PRD sections.

## 1. Write Mode Selection Page (`/write`)

Add visual separation between Free Write and AI modes:

- **Free Write** card (unchanged, top)
- Section divider labeled "AI Mode"
- **AI Conversation** card → `/write/conversation` (NEW)
- **Structured Prompts** card → `/write/structured` (existing)

## 2. AI Conversation Page (`/write/conversation`) — NEW

Chat-bubble interface cycling through 6 fixed questions (no AI in the conversation itself):

1. "How did your day start? What time did you wake up and how were you feeling?"
2. "What was the most notable thing that happened today?"
3. "Did you have any interesting conversations? What was said?"
4. "What were you thinking about the most today?"
5. "How are you feeling right now as the day ends?"
6. "Anything else you want to capture about today?"

**UI:** Message bubbles (AI = left/glass, user = right/accent). Input pinned at bottom with Send button. Skip button for each question. Generate Chapter button after all questions or anytime user wants to stop early.

**Data flow:** All answers concatenated as `rawEntry` → same `/api/generate-chapter` endpoint.

## 3. Updated Structured Prompts (`/write/structured`)

Replace current 8 prompts with PRD sections:

| Emoji | Label | Question |
|-------|-------|----------|
| Morning | How did you wake up? First thoughts? |
| Events | What happened today? Key moments? |
| Conversations | Notable things people said, your responses? |
| Thoughts | What was on your mind? |
| Feelings | Emotional state throughout the day? |
| Highlight | Best moment of the day? |
| Low Point | Worst or hardest moment? (optional) |
| Tomorrow | What are you looking forward to or dreading? |

Same expandable card UI, just updated content.

## Files

| File | Change |
|------|--------|
| `app/(dashboard)/write/page.tsx` | Divider + 3 cards layout |
| `app/(dashboard)/write/conversation/page.tsx` | NEW — chat bubble conversation |
| `app/(dashboard)/write/structured/page.tsx` | Update PROMPTS array |

No API changes. No database changes.

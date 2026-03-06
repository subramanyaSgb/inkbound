<div align="center">

# Inkbound

### Your Life, Bound in Ink

An AI-powered life journal that transforms your daily experiences into an evolving novel.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

</div>

---

## What is Inkbound?

Inkbound turns your everyday journal entries into beautifully written novel chapters. Write about your day in any format you prefer — free-form, guided conversation, or structured prompts — and AI transforms your words into a third-person (or first-person, your choice) narrative with literary quality.

Over time, your entries become chapters, chapters become volumes, and volumes become your life's novel — complete with character memory, mood tracking, dynamic covers, and more.

### Key Features

- **3 Writing Modes** — Free-form editor, AI-guided conversation, or structured prompts
- **Daily Entries** — Save entries throughout the day, generate chapters when you're ready
- **AI Chapter Generation** — Transforms raw entries into polished novel chapters (NVIDIA Kimi K2.5)
- **Character Memory** — Auto-detects people in your entries, remembers relationships across chapters
- **Family Tree & Social Circle** — Visual graph of all the people in your story
- **Dynamic Book Covers** — AI-generated covers that reflect your actual story content (Stable Diffusion XL)
- **Quote Wall** — Save and display your favorite lines from generated chapters
- **Alternate Universe** — Reimagine any chapter in a different genre (fantasy, noir, sci-fi, etc.)
- **Life Stats** — Mood arcs, word count trends, theme analysis, character frequency charts
- **Writing Streaks** — Track your daily writing habit
- **Entries Calendar** — Month view with word count intensity, draft/archived status
- **Chapter Regeneration** — Edit your entry and regenerate any chapter
- **Full Search** — Search across all chapters in a novel
- **Tarot Character Cards** — Stylized character profiles with archetype assignments

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 + Framer Motion |
| **Database** | Supabase (PostgreSQL + Row-Level Security) |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |
| **State** | Zustand 5 + localStorage persistence |
| **AI Text** | NVIDIA API — Kimi K2.5 |
| **AI Images** | Puter.js — Stable Diffusion XL |
| **Storage** | Supabase Storage (cover images) |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn/bun)
- A [Supabase](https://supabase.com/) project
- An [NVIDIA API key](https://build.nvidia.com/)

### 1. Clone & Install

```bash
git clone https://github.com/subramanyaSgb/inkbound.git
cd inkbound
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NVIDIA_API_KEY=nvapi-your-key-here
```

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `NVIDIA_API_KEY` | [build.nvidia.com](https://build.nvidia.com/) → Get API Key |

### 3. Database Setup

Run the migrations in order in the **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_story_profiles.sql
supabase/migrations/003_chapter_soft_delete.sql
supabase/migrations/004_reading_progress.sql
supabase/migrations/005_phase3_magic_features.sql
supabase/migrations/006_family_tree.sql
supabase/migrations/007_chapter_status.sql
supabase/migrations/008_allow_null_chapter_content.sql
supabase/migrations/008_covers_storage_policy.sql
supabase/migrations/009_daily_entries.sql
```

### 4. Optional: Google OAuth

To enable "Sign in with Google":
1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Follow the setup instructions to add your Google OAuth credentials

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, create a novel, and start writing.

---

## Project Structure

```
inkbound/
├── app/
│   ├── (auth)/                  # Login, Signup pages
│   ├── (dashboard)/             # Main app pages
│   │   ├── novel/[novelId]/     # Novel detail, chapters, quotes, stats, settings
│   │   ├── write/               # Entry editors (freeform, structured, conversation)
│   │   ├── entries/             # Daily entries calendar + list
│   │   ├── stats/               # Global stats dashboard
│   │   └── settings/            # App settings, profile, family tree
│   ├── api/                     # Backend API routes
│   │   ├── generate-chapter/    # Chapter generation pipeline
│   │   ├── process-chapter/     # Background AI processing
│   │   ├── generate-cover/      # Cover image prompt builder
│   │   ├── generate-alternate/  # Alternate universe chapters
│   │   └── chapter-status/      # Polling endpoint
│   ├── layout.tsx               # Root layout, metadata, fonts
│   └── globals.css              # Theme tokens, utilities
│
├── components/
│   ├── ui/                      # Base components (Button, Card, Modal, Input, Toast)
│   ├── write/                   # Editor components, save status, profile scanner
│   ├── entries/                 # Calendar, entry list, streak counter
│   ├── novel/                   # Chapter reader, novel cards, quote wall
│   ├── layout/                  # Sidebar, mobile nav, header
│   ├── settings/                # Family tree, relationship forms
│   └── stats/                   # Charts, mood analysis
│
├── lib/
│   ├── ai/                      # AI prompts (chapter, cover, alternate)
│   ├── supabase/                # Client, server, middleware helpers
│   ├── daily-entries.ts         # Entry CRUD operations
│   ├── relationships.ts         # Family tree CRUD
│   ├── profile-scanner.ts       # Auto-detect people in entries
│   ├── rate-limit.ts            # In-memory rate limiter
│   └── constants.ts             # Genres, POVs, styles, relationships
│
├── stores/
│   ├── write-store.ts           # Writing session state
│   ├── entry-store.ts           # Daily entry persistence (localStorage + Supabase)
│   └── sidebar-store.ts         # UI state
│
├── hooks/
│   └── useAutoSave.ts           # 15s debounced auto-save
│
├── types/
│   └── index.ts                 # All TypeScript interfaces
│
├── supabase/
│   └── migrations/              # 10 SQL migration files
│
└── public/                      # Static assets
```

---

## Design System

Inkbound uses a **Modern Dark Luxury** theme inspired by premium publishing aesthetics.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `ink-deep` | `#09090B` | Primary background |
| `ink-surface` | `#1A1A1F` | Cards, surfaces |
| `accent-primary` | `#D4AF37` | Gold accent, CTAs |
| `accent-warm` | `#C9956B` | Warm highlights |
| `text-primary` | `#FAFAFA` | Main text |
| `text-secondary` | `#D4D4D8` | Secondary text |
| `text-muted` | `#71717A` | Muted labels |

### Typography

| Font | Usage |
|------|-------|
| **Playfair Display** | Headings, chapter titles |
| **Crimson Pro** | Body text, entry content |
| **DM Sans** | UI elements, labels, buttons |
| **JetBrains Mono** | Code, stats, dates |

### Effects

- **Glass morphism** — `glass-card` class with backdrop blur
- **Glow accents** — `glow-border`, `shadow-glow-sm/md/lg`
- **Smooth animations** — Framer Motion page transitions, staggered reveals

---

## How It Works

```
  You write about your day
         │
         ▼
  ┌─────────────────┐
  │  Daily Entry     │  ← Free-form, Structured, or Conversation mode
  │  (auto-saved)    │     Auto-saves every 15s + localStorage backup
  └────────┬────────┘
           │  Click "Generate Chapter"
           ▼
  ┌─────────────────┐
  │  Profile Scan    │  ← Detects new people, asks for relationship info
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  AI Generation   │  ← Kimi K2.5 with character memory + relationship context
  │  (background)    │     Generates title, content, mood, tags, opening quote
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Novel Chapter   │  ← Beautiful reading mode with prev/next navigation
  │  + Volume        │     Auto-organized by year into volumes
  └─────────────────┘
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

The app uses Next.js App Router — Vercel handles everything automatically.

### Environment Variables for Production

Set the same 3 variables from `.env.local` in your hosting platform's environment settings.

---

## Data Model

```
profiles ──────── novels ──────── volumes ──────── chapters
    │                │                                  │
    │                ├── story_profiles                  ├── saved_quotes
    │                │       │                          └── alternate_chapters
    │                │       └── profile_relationships
    │                │
    │                └── daily_entries
    │
    └── life_stats
```

All tables are protected with **Row-Level Security (RLS)** — users can only access their own data.

---

## Acknowledgments

- **NVIDIA** — AI inference API (Kimi K2.5 for text generation)
- **Puter.js** — Free client-side image generation (Stable Diffusion XL)
- **Supabase** — Database, auth, and storage
- **Vercel** — Hosting and deployment
- **Lucide** — Beautiful icon set

---

<div align="center">

Built with ink and intention.

**[Inkbound](https://github.com/subramanyaSgb/inkbound)** — Write your life. Read your story.

</div>

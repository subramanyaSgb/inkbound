# Phase 2 Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 features — PWA icons, mobile compact mode, enhanced loading screen, entry edit/regenerate, and smart profile system.

**Architecture:** Mobile-first Tailwind responsive classes for compact mode. SVG-based PWA icons with Next.js metadata conventions. Typewriter animation via React state + intervals. Edit/regenerate via query params on existing freeform page. Smart profiles via new `story_profiles` DB table + pre-generation scanning modal.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Framer Motion, Zustand

---

## Task 1: PWA Manifest & HD App Icons

**Files:**
- Create: `app/manifest.ts`
- Create: `app/icon.svg`
- Create: `app/apple-icon.tsx` (Next.js ImageResponse for apple-touch-icon)
- Create: `app/opengraph-image.tsx` (optional, for social sharing)
- Modify: `app/layout.tsx:29-32`
- Delete & Replace: `app/favicon.ico`

**Step 1: Create the SVG app icon**

Create `app/icon.svg` — a gold quill pen on the dark leather background:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0D0B0E"/>
  <g transform="translate(256,256) rotate(-45) translate(-100,-140)">
    <!-- Quill feather -->
    <path d="M100 0 C60 40, 20 120, 10 200 C10 200, 50 180, 80 140 C80 140, 100 180, 90 220 L110 220 C120 180, 120 140, 120 140 C150 180, 190 200, 190 200 C180 120, 140 40, 100 0Z" fill="#C4956A" opacity="0.9"/>
    <!-- Quill stem -->
    <line x1="100" y1="160" x2="100" y2="300" stroke="#C4956A" stroke-width="4" stroke-linecap="round"/>
    <!-- Nib -->
    <path d="M96 280 L100 310 L104 280" fill="#C4956A"/>
    <!-- Ink dot -->
    <circle cx="100" cy="316" r="6" fill="#C4956A" opacity="0.6"/>
  </g>
</svg>
```

**Step 2: Create the Next.js manifest route**

Create `app/manifest.ts`:

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inkbound',
    short_name: 'Inkbound',
    description: 'Your life, bound in ink.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0B0E',
    theme_color: '#0D0B0E',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
```

**Step 3: Create apple-touch-icon via ImageResponse**

Create `app/apple-icon.tsx`:

```tsx
import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0D0B0E',
          borderRadius: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontSize: 90,
          color: '#C4956A',
        }}
      >
        I
      </div>
    ),
    { ...size }
  )
}
```

Note: The apple-icon uses a simple "I" monogram since ImageResponse can't render complex SVG paths. The SVG icon is the primary icon for Android/PWA.

**Step 4: Update root layout metadata**

In `app/layout.tsx`, update the metadata export:

```typescript
export const metadata: Metadata = {
  title: 'Inkbound',
  description: 'Your life, bound in ink.',
  themeColor: '#0D0B0E',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Inkbound',
  },
}
```

**Step 5: Delete old favicon.ico**

Delete `app/favicon.ico`. The `icon.svg` replaces it via Next.js metadata conventions.

**Step 6: Verify**

Run: `npm run build` to ensure no errors.
Check: Open http://localhost:3000/manifest.webmanifest — should return valid JSON.
Check: Open http://localhost:3000/icon.svg — should show the quill icon.

**Step 7: Commit**

```bash
git add app/manifest.ts app/icon.svg app/apple-icon.tsx app/layout.tsx
git rm app/favicon.ico
git commit -m "feat: add PWA manifest with HD quill icon and theme colors"
```

---

## Task 2: Mobile Compact Mode — UI Primitives (Card, Button, Input)

**Files:**
- Modify: `components/ui/Card.tsx:11` (change `p-6` to `p-3 md:p-6`)
- Modify: `components/ui/Button.tsx:19-23` (add responsive sizes)
- Modify: `components/ui/Input.tsx:20` (compact on mobile)

**Step 1: Update Card component**

In `components/ui/Card.tsx`, change the base padding from `p-6` to responsive:

```
Old: rounded-xl bg-ink-card border border-ink-border p-6
New: rounded-xl bg-ink-card border border-ink-border p-4 md:p-6
```

**Step 2: Update Button sizes to be compact on mobile**

In `components/ui/Button.tsx`, update the sizes object:

```typescript
const sizes = {
  sm: 'px-3 py-1.5 text-xs md:text-sm',
  md: 'px-3 py-2 text-sm md:px-4 md:text-base',
  lg: 'px-4 py-2.5 text-base md:px-6 md:py-3 md:text-lg',
}
```

**Step 3: Update Input for tighter mobile padding**

In `components/ui/Input.tsx`, change `px-4 py-2.5` to `px-3 py-2 md:px-4 md:py-2.5`.

**Step 4: Commit**

```bash
git add components/ui/Card.tsx components/ui/Button.tsx components/ui/Input.tsx
git commit -m "feat: make UI primitives compact on mobile"
```

---

## Task 3: Mobile Compact Mode — Dashboard Layout & Header

**Files:**
- Modify: `app/(dashboard)/layout.tsx:22`
- Modify: `components/layout/Header.tsx:18-19`
- Modify: `components/layout/MobileNav.tsx:16`

**Step 1: Tighten main content padding**

In `app/(dashboard)/layout.tsx`, update the `<main>` tag:

```
Old: <main className="flex-1 px-4 py-6 pb-20 lg:px-8 lg:py-8 lg:pb-8">
New: <main className="flex-1 px-3 py-4 pb-20 md:px-4 md:py-6 lg:px-8 lg:py-8 lg:pb-8">
```

**Step 2: Compact header**

In `components/layout/Header.tsx`, update the header:

```
Old: <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-border bg-ink-bg/80 backdrop-blur-sm px-4 py-3 lg:px-6">
     <h1 className="font-display text-2xl text-accent-primary">Inkbound</h1>

New: <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-border bg-ink-bg/80 backdrop-blur-sm px-3 py-2 md:px-4 md:py-3 lg:px-6">
     <h1 className="font-display text-xl md:text-2xl text-accent-primary">Inkbound</h1>
```

**Step 3: Compact mobile nav**

In `components/layout/MobileNav.tsx`, tighten padding:

```
Old: <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-ink-border bg-ink-bg/95 backdrop-blur-sm py-2 lg:hidden">
New: <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-ink-border bg-ink-bg/95 backdrop-blur-sm py-1.5 lg:hidden">
```

And the nav items:
```
Old: className="flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-ui transition-colors
New: className="flex flex-col items-center gap-0 px-3 py-0.5 text-[11px] font-ui transition-colors
```

**Step 4: Commit**

```bash
git add app/(dashboard)/layout.tsx components/layout/Header.tsx components/layout/MobileNav.tsx
git commit -m "feat: compact layout, header, and nav for mobile"
```

---

## Task 4: Mobile Compact Mode — Home Page & Novel Cards

**Files:**
- Modify: `app/(dashboard)/page.tsx:49-65`
- Modify: `components/novel/NovelCard.tsx:10-39`

**Step 1: Update home page headings and grid**

In `app/(dashboard)/page.tsx`:

Heading area:
```
Old: <h1 className="font-display text-3xl text-text-primary">Your Library</h1>
New: <h1 className="font-display text-xl md:text-3xl text-text-primary">Your Library</h1>
```

```
Old: <div className="flex items-center justify-between mb-8">
New: <div className="flex items-center justify-between mb-4 md:mb-8">
```

Empty state:
```
Old: <p className="font-display text-2xl text-text-secondary mb-2">No novels yet</p>
New: <p className="font-display text-lg md:text-2xl text-text-secondary mb-2">No novels yet</p>
```

Grid:
```
Old: <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
New: <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
```

**Step 2: Update NovelCard**

In `components/novel/NovelCard.tsx`:

```
Old: <Card hover className="flex flex-col gap-3">
New: <Card hover className="flex flex-row md:flex-col gap-3">
```

Change the cover placeholder for horizontal mobile layout:
```
Old: <div className="aspect-[3/4] w-full rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center overflow-hidden">
New: <div className="aspect-square w-16 md:aspect-[3/4] md:w-full flex-shrink-0 rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center overflow-hidden">
```

Cover text:
```
Old: <p className="font-display text-lg text-accent-primary">{novel.title}</p>
New: <p className="font-display text-sm md:text-lg text-accent-primary">{novel.title}</p>
```

Title in info:
```
Old: <h3 className="font-display text-lg text-text-primary truncate">{novel.title}</h3>
New: <h3 className="font-display text-base md:text-lg text-text-primary truncate">{novel.title}</h3>
```

**Step 3: Commit**

```bash
git add app/(dashboard)/page.tsx components/novel/NovelCard.tsx
git commit -m "feat: compact novel library and cards for mobile"
```

---

## Task 5: Mobile Compact Mode — Novel Detail & Chapter List

**Files:**
- Modify: `app/(dashboard)/novel/[novelId]/page.tsx:26-53`
- Modify: `components/novel/ChapterList.tsx:33`

**Step 1: Update novel detail page**

In `app/(dashboard)/novel/[novelId]/page.tsx`:

```
Old: <div className="mb-8">
New: <div className="mb-4 md:mb-8">
```

```
Old: <h1 className="font-display text-3xl text-text-primary">{novel.title}</h1>
New: <h1 className="font-display text-xl md:text-3xl text-text-primary">{novel.title}</h1>
```

```
Old: <div className="flex gap-3 mb-8">
New: <div className="flex gap-2 md:gap-3 mb-4 md:mb-8">
```

```
Old: <h2 className="font-display text-xl text-text-primary mb-4">Chapters</h2>
New: <h2 className="font-display text-lg md:text-xl text-text-primary mb-3 md:mb-4">Chapters</h2>
```

**Step 2: Compact chapter list items**

In `components/novel/ChapterList.tsx`:

```
Old: <div className="flex items-start gap-4 p-4 rounded-lg border border-ink-border bg-ink-card hover:border-accent-primary/30 transition-colors">
New: <div className="flex items-start gap-3 p-3 md:p-4 rounded-lg border border-ink-border bg-ink-card hover:border-accent-primary/30 transition-colors">
```

```
Old: <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center">
New: <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-ink-surface border border-ink-border flex items-center justify-center">
```

```
Old: <span className="text-sm font-ui text-text-secondary">{chapter.chapter_number}</span>
New: <span className="text-xs md:text-sm font-ui text-text-secondary">{chapter.chapter_number}</span>
```

**Step 3: Commit**

```bash
git add app/(dashboard)/novel/[novelId]/page.tsx components/novel/ChapterList.tsx
git commit -m "feat: compact novel detail and chapter list for mobile"
```

---

## Task 6: Mobile Compact Mode — Chapter Reader

**Files:**
- Modify: `components/novel/ChapterReader.tsx` (full file)
- Modify: `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx:43-65`

**Step 1: Update ChapterReader component**

Replace the entire `ChapterReader.tsx` body with mobile-first responsive classes:

In `components/novel/ChapterReader.tsx`:

Header section:
```
Old: <header className="text-center mb-10">
     <p className="text-sm text-text-muted font-ui mb-2">
     <h1 className="font-display text-3xl lg:text-4xl text-text-primary mb-6">
New: <header className="text-center mb-6 md:mb-10">
     <p className="text-xs md:text-sm text-text-muted font-ui mb-1 md:mb-2">
     <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-text-primary mb-4 md:mb-6">
```

Opening quote:
```
Old: <blockquote className="font-body italic text-text-secondary text-lg border-l-2 border-accent-primary/30 pl-4 mx-auto max-w-md text-left">
New: <blockquote className="font-body italic text-text-secondary text-base md:text-lg border-l-2 border-accent-primary/30 pl-3 md:pl-4 mx-auto max-w-md text-left">
```

Divider:
```
Old: <div className="flex justify-center mb-10">
New: <div className="flex justify-center mb-6 md:mb-10">
```

Paragraphs:
```
Old: <div className="prose-reading space-y-6">
     <p key={i} className="font-body text-lg text-text-primary leading-[1.8] tracking-wide">
New: <div className="prose-reading space-y-4 md:space-y-6">
     <p key={i} className="font-body text-base md:text-lg text-text-primary leading-relaxed md:leading-[1.8] tracking-normal md:tracking-wide">
```

Footer:
```
Old: <footer className="mt-16 pt-8 border-t border-ink-border">
New: <footer className="mt-8 md:mt-16 pt-6 md:pt-8 border-t border-ink-border">
```

Soundtrack card:
```
Old: <div className="flex items-center gap-3 p-4 rounded-lg bg-ink-surface border border-ink-border mb-6">
New: <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-ink-surface border border-ink-border mb-4 md:mb-6">
```

Mood/tag chips:
```
Old: <span className="px-3 py-1 rounded-full bg-ink-surface border border-ink-border text-sm text-text-secondary">
     <span key={tag} className="px-3 py-1 rounded-full bg-ink-surface text-sm text-text-muted">
New: <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-ink-surface border border-ink-border text-xs md:text-sm text-text-secondary">
     <span key={tag} className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-ink-surface text-xs md:text-sm text-text-muted">
```

**Step 2: Update chapter page nav**

In `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx`:

```
Old: <div className="max-w-3xl mx-auto pb-12">
New: <div className="max-w-3xl mx-auto pb-8 md:pb-12">
```

```
Old: <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-8 inline-block">
New: <Link href={`/novel/${novelId}`} className="text-xs md:text-sm text-text-muted hover:text-text-secondary mb-4 md:mb-8 inline-block">
```

```
Old: <div className="flex justify-between mt-12">
New: <div className="flex justify-between mt-6 md:mt-12">
```

**Step 3: Commit**

```bash
git add components/novel/ChapterReader.tsx app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx
git commit -m "feat: compact chapter reader for mobile"
```

---

## Task 7: Mobile Compact Mode — Write Pages & Settings

**Files:**
- Modify: `app/(dashboard)/write/page.tsx:24-56`
- Modify: `app/(dashboard)/write/freeform/page.tsx:50-79`
- Modify: `app/(dashboard)/settings/page.tsx:54-75`
- Modify: `app/(dashboard)/novel/new/page.tsx:57-156`
- Modify: `app/(dashboard)/novel/[novelId]/settings/page.tsx:70-138`

**Step 1: Compact write selection page**

In `app/(dashboard)/write/page.tsx`:

```
Old: <h1 className="font-display text-3xl text-text-primary mb-2">What happened today?</h1>
     <p className="text-text-secondary mb-8">Select your novel and start writing.</p>
New: <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1 md:mb-2">What happened today?</h1>
     <p className="text-text-secondary text-sm md:text-base mb-4 md:mb-8">Select your novel and start writing.</p>
```

```
Old: <div className="mb-6">
New: <div className="mb-4 md:mb-6">
```

**Step 2: Compact freeform write page**

In `app/(dashboard)/write/freeform/page.tsx`:

```
Old: <div className="flex items-center justify-between mb-6">
New: <div className="flex items-center justify-between mb-4 md:mb-6">
```

```
Old: <div className="flex justify-end mt-6 gap-3">
New: <div className="flex flex-col-reverse sm:flex-row justify-end mt-4 md:mt-6 gap-2 md:gap-3">
```

**Step 3: Compact settings page**

In `app/(dashboard)/settings/page.tsx`:

```
Old: <h1 className="font-display text-3xl text-text-primary mb-8">Settings</h1>
     <div className="space-y-6">
New: <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Settings</h1>
     <div className="space-y-4 md:space-y-6">
```

**Step 4: Compact create novel page**

In `app/(dashboard)/novel/new/page.tsx`:

```
Old: <h1 className="font-display text-3xl text-text-primary mb-8">Create a New Novel</h1>
     <form onSubmit={handleCreate} className="space-y-6">
New: <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Create a New Novel</h1>
     <form onSubmit={handleCreate} className="space-y-4 md:space-y-6">
```

**Step 5: Compact novel settings page**

In `app/(dashboard)/novel/[novelId]/settings/page.tsx`:

```
Old: <h1 className="font-display text-3xl text-text-primary mb-8">Novel Settings</h1>
     <div className="space-y-6">
New: <h1 className="font-display text-xl md:text-3xl text-text-primary mb-4 md:mb-8">Novel Settings</h1>
     <div className="space-y-4 md:space-y-6">
```

**Step 6: Commit**

```bash
git add app/(dashboard)/write/page.tsx app/(dashboard)/write/freeform/page.tsx app/(dashboard)/settings/page.tsx app/(dashboard)/novel/new/page.tsx app/(dashboard)/novel/[novelId]/settings/page.tsx
git commit -m "feat: compact write, settings, and create pages for mobile"
```

---

## Task 8: Enhanced Loading Screen — Typewriter Animation

**Files:**
- Modify: `components/write/GeneratingAnimation.tsx` (complete rewrite)

**Step 1: Rewrite GeneratingAnimation with typewriter effect**

Replace entire `components/write/GeneratingAnimation.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const contentPool = [
  // Writing facts
  'Tolkien took 12 years to write Lord of the Rings.',
  'Victor Hugo wrote The Hunchback of Notre-Dame in just 6 months.',
  'Charles Dickens published most of his novels as weekly serials.',
  'Agatha Christie is the best-selling fiction writer of all time — 2 billion copies sold.',
  'The longest novel ever written is "In Search of Lost Time" — 1.2 million words.',

  // Funny quotes
  '"I can write better than anybody who can write faster, and faster than anybody who can write better." — A.J. Liebling',
  '"Writing is easy. All you have to do is cross out the wrong words." — Mark Twain',
  '"I love deadlines. I love the whooshing noise they make as they go by." — Douglas Adams',
  '"The first draft of anything is garbage." — Ernest Hemingway',
  '"If you want to be a writer, you must do two things: read a lot and write a lot." — Stephen King',

  // Motivational
  '"Start writing, no matter what. The water does not flow until the faucet is turned on." — Louis L\'Amour',
  '"There is no greater agony than bearing an untold story inside you." — Maya Angelou',
  '"You can always edit a bad page. You can\'t edit a blank page." — Jodi Picoult',
  '"We write to taste life twice, in the moment and in retrospect." — Anais Nin',
  '"A writer is someone for whom writing is more difficult than it is for other people." — Thomas Mann',

  // Random trivia
  'Octopuses have three hearts and blue blood.',
  'Honey never spoils — edible honey was found in 3,000-year-old Egyptian tombs.',
  'A group of flamingos is called a "flamboyance."',
  'The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896).',
  'Bananas are technically berries, but strawberries aren\'t.',

  // Book facts
  'The first novel ever written is "The Tale of Genji" from 1010 AD.',
  'The Bible is the most shoplifted book in the world.',
  'Dr. Seuss wrote "Green Eggs and Ham" using only 50 different words.',
  'Shakespeare invented over 1,700 words we still use today.',
  'J.K. Rowling was rejected by 12 publishers before Harry Potter was accepted.',

  // More writing facts
  'Leo Tolstoy\'s wife hand-copied War and Peace seven times.',
  'Edgar Allan Poe married his 13-year-old cousin.',
  'The word "nerd" was first used by Dr. Seuss in "If I Ran the Zoo" (1950).',
  'Franz Kafka asked his friend to burn all his unpublished works. His friend didn\'t.',
  'Maya Angelou rented a hotel room to write in — she never slept there.',
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function GeneratingAnimation() {
  const [items] = useState(() => shuffleArray(contentPool))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'fading'>('typing')

  const currentItem = items[currentIndex % items.length]

  const advanceToNext = useCallback(() => {
    setPhase('fading')
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDisplayedText('')
      setPhase('typing')
    }, 800) // fade out duration + pause
  }, [])

  useEffect(() => {
    if (phase !== 'typing') return

    if (displayedText.length < currentItem.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentItem.slice(0, displayedText.length + 1))
      }, 35)
      return () => clearTimeout(timer)
    } else {
      // Done typing, pause then advance
      setPhase('pausing')
      const timer = setTimeout(advanceToNext, 2000)
      return () => clearTimeout(timer)
    }
  }, [displayedText, currentItem, phase, advanceToNext])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-bg/95 backdrop-blur-sm px-6"
    >
      {/* Ink drop */}
      <motion.div
        className="w-3 h-3 rounded-full bg-accent-primary mb-10"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Typewriter text */}
      <div className="h-24 flex items-center justify-center max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'fading' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="font-body text-base md:text-lg text-text-primary text-center leading-relaxed"
          >
            {displayedText}
            <span className="inline-block w-0.5 h-5 bg-accent-primary ml-0.5 animate-pulse align-text-bottom" />
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Bottom text */}
      <motion.p
        className="font-ui text-xs text-text-muted mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Crafting your chapter...
      </motion.p>
    </motion.div>
  )
}
```

**Step 2: Verify no import changes needed**

The component is already imported in `app/(dashboard)/write/freeform/page.tsx:7`. No changes needed.

**Step 3: Commit**

```bash
git add components/write/GeneratingAnimation.tsx
git commit -m "feat: typewriter loading animation with rotating fun facts and quotes"
```

---

## Task 9: Entry Edit & Regenerate — Write Store + Freeform Page

**Files:**
- Modify: `stores/write-store.ts`
- Modify: `app/(dashboard)/write/freeform/page.tsx`

**Step 1: Add editingChapterId to write store**

Update `stores/write-store.ts`:

```typescript
import { create } from 'zustand'

interface WriteStore {
  selectedNovelId: string | null
  rawEntry: string
  entryDate: string
  isGenerating: boolean
  editingChapterId: string | null
  setSelectedNovelId: (id: string | null) => void
  setRawEntry: (text: string) => void
  setEntryDate: (date: string) => void
  setIsGenerating: (val: boolean) => void
  setEditingChapterId: (id: string | null) => void
  reset: () => void
}

export const useWriteStore = create<WriteStore>((set) => ({
  selectedNovelId: null,
  rawEntry: '',
  entryDate: new Date().toISOString().split('T')[0],
  isGenerating: false,
  editingChapterId: null,
  setSelectedNovelId: (id) => set({ selectedNovelId: id }),
  setRawEntry: (text) => set({ rawEntry: text }),
  setEntryDate: (date) => set({ entryDate: date }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setEditingChapterId: (id) => set({ editingChapterId: id }),
  reset: () => set({ rawEntry: '', entryDate: new Date().toISOString().split('T')[0], isGenerating: false, editingChapterId: null }),
}))
```

**Step 2: Update freeform page to handle edit mode**

Replace `app/(dashboard)/write/freeform/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWriteStore } from '@/stores/write-store'
import { FreeformEditor } from '@/components/write/FreeformEditor'
import { GeneratingAnimation } from '@/components/write/GeneratingAnimation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export default function FreeformWritePage() {
  const searchParams = useSearchParams()
  const novelId = searchParams.get('novelId')
  const chapterId = searchParams.get('chapterId')
  const router = useRouter()
  const { rawEntry, entryDate, setEntryDate, setSelectedNovelId, setRawEntry, isGenerating, setIsGenerating, editingChapterId, setEditingChapterId, reset } = useWriteStore()
  const [error, setError] = useState('')
  const [isLoadingEntry, setIsLoadingEntry] = useState(false)
  const isEditing = !!chapterId

  useEffect(() => {
    if (novelId) setSelectedNovelId(novelId)
  }, [novelId, setSelectedNovelId])

  // Load existing entry when editing
  useEffect(() => {
    if (!chapterId) return
    setIsLoadingEntry(true)
    setEditingChapterId(chapterId)

    const supabase = createClient()
    supabase
      .from('chapters')
      .select('raw_entry, entry_date')
      .eq('id', chapterId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRawEntry(data.raw_entry)
          setEntryDate(data.entry_date)
        }
        setIsLoadingEntry(false)
      })
  }, [chapterId, setEditingChapterId, setRawEntry, setEntryDate])

  async function handleGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate,
          ...(isEditing && { chapterId }),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate chapter')
      }

      const { chapterId: resultChapterId } = await response.json()
      reset()
      router.push(`/novel/${novelId}/chapter/${resultChapterId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }

  if (isLoadingEntry) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[200px]">
        <p className="text-text-muted font-ui text-sm">Loading entry...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button onClick={() => { reset(); router.back() }} className="text-sm text-text-muted hover:text-text-secondary">
          &larr; Back
        </button>
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-auto text-sm"
        />
      </div>

      {isEditing && (
        <p className="text-xs text-accent-primary font-ui mb-3">Editing entry — changes will regenerate this chapter</p>
      )}

      <Card className="min-h-[300px] md:min-h-[400px]">
        <FreeformEditor />
      </Card>

      {error && <p className="text-sm text-status-error mt-4">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-end mt-4 md:mt-6 gap-2 md:gap-3">
        <Button variant="secondary" onClick={() => { reset(); router.back() }}>
          Discard
        </Button>
        <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!rawEntry.trim()}>
          {isGenerating
            ? (isEditing ? 'Regenerating...' : 'Generating Chapter...')
            : (isEditing ? 'Regenerate Chapter' : 'Generate Chapter')
          }
        </Button>
      </div>

      {isGenerating && <GeneratingAnimation />}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add stores/write-store.ts app/(dashboard)/write/freeform/page.tsx
git commit -m "feat: support editing existing entries and regenerating chapters"
```

---

## Task 10: Entry Edit & Regenerate — API Update + Chapter Reader Button

**Files:**
- Modify: `app/api/generate-chapter/route.ts`
- Modify: `components/novel/ChapterReader.tsx`
- Modify: `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx`

**Step 1: Update generate API to support updating existing chapters**

In `app/api/generate-chapter/route.ts`, change the request parsing to accept optional `chapterId`:

```
Old: const { novelId, rawEntry, entryDate } = await request.json()
New: const { novelId, rawEntry, entryDate, chapterId } = await request.json()
```

When `chapterId` is provided, skip chapter number calculation and volume creation. Instead, fetch the existing chapter's number and volume. Replace the "Save chapter" insert block with conditional insert/update:

After the `generateChapter()` call (around line 89), replace the save block (lines 91-117) with:

```typescript
    let savedChapter

    if (chapterId) {
      // Update existing chapter
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .update({
          title: result.title,
          content: result.content,
          raw_entry: rawEntry,
          entry_date: entryDate,
          mood: result.mood,
          mood_score: result.mood_score,
          tags: result.tags,
          opening_quote: result.opening_quote,
          soundtrack_suggestion: result.soundtrack
            ? `${result.soundtrack.song} by ${result.soundtrack.artist}`
            : null,
          word_count: result.content.split(/\s+/).length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId)
        .eq('novel_id', novelId)
        .select()
        .single()

      if (chapterError) {
        return NextResponse.json({ error: chapterError.message }, { status: 500 })
      }
      savedChapter = chapter
    } else {
      // Insert new chapter (existing logic)
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          novel_id: novelId,
          volume_id: volume?.id || null,
          chapter_number: chapterNumber,
          title: result.title,
          content: result.content,
          raw_entry: rawEntry,
          entry_mode: 'freeform',
          entry_date: entryDate,
          mood: result.mood,
          mood_score: result.mood_score,
          tags: result.tags,
          opening_quote: result.opening_quote,
          soundtrack_suggestion: result.soundtrack
            ? `${result.soundtrack.song} by ${result.soundtrack.artist}`
            : null,
          word_count: result.content.split(/\s+/).length,
        })
        .select()
        .single()

      if (chapterError) {
        return NextResponse.json({ error: chapterError.message }, { status: 500 })
      }
      savedChapter = chapter
    }
```

Then change the return to use `savedChapter`:
```
Old: return NextResponse.json({ chapterId: chapter.id })
New: return NextResponse.json({ chapterId: savedChapter.id })
```

Also, when `chapterId` is provided, we need to get the existing chapter's data for the prompt. Add this after the `chapterId` extraction:

```typescript
    let chapterNumber = (chapterCount || 0) + 1
    let volume = existingVolume

    if (chapterId) {
      // Fetch existing chapter to preserve its number/volume
      const { data: existingChapter } = await supabase
        .from('chapters')
        .select('chapter_number, volume_id')
        .eq('id', chapterId)
        .single()
      if (existingChapter) {
        chapterNumber = existingChapter.chapter_number
      }
    }
```

**Step 2: Add "Edit Entry" button to ChapterReader**

In `components/novel/ChapterReader.tsx`, the component currently only receives `chapter`. We need to also pass `novelId` for the edit link. Update the props:

```typescript
import Link from 'next/link'
import type { Chapter } from '@/types'

export function ChapterReader({ chapter, novelId }: { chapter: Chapter; novelId: string }) {
```

Add the edit button right after the chapter number line in the header:

```tsx
      <header className="text-center mb-6 md:mb-10">
        <div className="flex items-center justify-between mb-2">
          <div />
          <p className="text-xs md:text-sm text-text-muted font-ui">
            Chapter {chapter.chapter_number}
          </p>
          <Link
            href={`/write/freeform?novelId=${novelId}&chapterId=${chapter.id}`}
            className="text-xs font-ui text-accent-primary hover:text-accent-primary/80 transition-colors"
          >
            Edit Entry
          </Link>
        </div>
```

**Step 3: Update chapter page to pass novelId to ChapterReader**

In `app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx`:

```
Old: <ChapterReader chapter={chapter} />
New: <ChapterReader chapter={chapter} novelId={novelId} />
```

**Step 4: Commit**

```bash
git add app/api/generate-chapter/route.ts components/novel/ChapterReader.tsx app/(dashboard)/novel/[novelId]/chapter/[chapterId]/page.tsx
git commit -m "feat: edit entry and regenerate chapter from reader page"
```

---

## Task 11: Smart Profiles — Database Migration & Types

**Files:**
- Create: `supabase/migrations/002_story_profiles.sql`
- Modify: `types/index.ts`

**Step 1: Create the migration**

Create `supabase/migrations/002_story_profiles.sql`:

```sql
-- ============================================
-- STORY PROFILES (characters, locations, personal info)
-- Named story_profiles to avoid conflict with auth profiles table
-- ============================================
CREATE TABLE story_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'character', 'location')),
  name TEXT NOT NULL,
  relationship TEXT,
  nickname TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_story_profiles_user ON story_profiles(user_id);
CREATE INDEX idx_story_profiles_user_type ON story_profiles(user_id, type);

ALTER TABLE story_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own story profiles" ON story_profiles
  FOR ALL USING (auth.uid() = user_id);
```

**Step 2: Add TypeScript types**

Add to `types/index.ts` before the final `NovelWithChapterCount` interface:

```typescript
export type StoryProfileType = 'personal' | 'character' | 'location'

export interface StoryProfile {
  id: string
  user_id: string
  type: StoryProfileType
  name: string
  relationship: string | null
  nickname: string | null
  details: Record<string, string>
  created_at: string
  updated_at: string
}
```

**Step 3: Commit**

```bash
git add supabase/migrations/002_story_profiles.sql types/index.ts
git commit -m "feat: add story_profiles table and types for character/location data"
```

---

## Task 12: Smart Profiles — Settings UI (CRUD)

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx` (major expansion)
- Create: `components/settings/StoryProfileSection.tsx`
- Create: `components/settings/StoryProfileForm.tsx`

**Step 1: Create StoryProfileForm component**

Create `components/settings/StoryProfileForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import type { StoryProfile, StoryProfileType } from '@/types'

interface StoryProfileFormProps {
  type: StoryProfileType
  profile?: StoryProfile | null
  onSave: (data: { name: string; relationship: string; nickname: string; details: Record<string, string> }) => Promise<void>
  onCancel: () => void
}

const detailFields: Record<StoryProfileType, string[]> = {
  personal: ['age', 'job', 'personality', 'appearance', 'habits'],
  character: ['age', 'personality', 'appearance', 'occupation', 'quirks'],
  location: ['type', 'description', 'significance'],
}

export function StoryProfileForm({ type, profile, onSave, onCancel }: StoryProfileFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [relationship, setRelationship] = useState(profile?.relationship || '')
  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [details, setDetails] = useState<Record<string, string>>(profile?.details || {})
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    await onSave({ name, relationship, nickname, details })
    setIsSaving(false)
  }

  function setDetail(key: string, value: string) {
    setDetails(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
        {type === 'character' && (
          <Input label="Relationship" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="e.g. wife, friend, brother" />
        )}
        {type !== 'location' && (
          <Input label="Nickname (optional)" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="How you refer to them" />
        )}

        <div className="pt-2">
          <p className="text-xs font-ui text-text-muted mb-2">Details (all optional — fill what you want the AI to know)</p>
          <div className="space-y-2">
            {detailFields[type].map(field => (
              <Input
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={details[field] || ''}
                onChange={e => setDetail(field, e.target.value)}
                placeholder={`Enter ${field}...`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={isSaving} size="sm">Save</Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}
```

**Step 2: Create StoryProfileSection component**

Create `components/settings/StoryProfileSection.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StoryProfileForm } from './StoryProfileForm'
import type { StoryProfile, StoryProfileType } from '@/types'

interface StoryProfileSectionProps {
  type: StoryProfileType
  title: string
  description: string
}

export function StoryProfileSection({ type, title, description }: StoryProfileSectionProps) {
  const [profiles, setProfiles] = useState<StoryProfile[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .order('created_at')
    if (data) setProfiles(data)
  }

  async function handleSave(data: { name: string; relationship: string; nickname: string; details: Record<string, string> }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('story_profiles').insert({
      user_id: user.id,
      type,
      name: data.name,
      relationship: data.relationship || null,
      nickname: data.nickname || null,
      details: data.details,
    })
    setIsAdding(false)
    await loadProfiles()
  }

  async function handleUpdate(id: string, data: { name: string; relationship: string; nickname: string; details: Record<string, string> }) {
    await supabase.from('story_profiles').update({
      name: data.name,
      relationship: data.relationship || null,
      nickname: data.nickname || null,
      details: data.details,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setEditingId(null)
    await loadProfiles()
  }

  async function handleDelete(id: string) {
    await supabase.from('story_profiles').delete().eq('id', id)
    await loadProfiles()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-base md:text-lg text-text-primary">{title}</h2>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)}>+ Add</Button>
      </div>

      {profiles.length === 0 && !isAdding && (
        <Card>
          <p className="text-sm text-text-muted text-center py-4">No {title.toLowerCase()} added yet.</p>
        </Card>
      )}

      <div className="space-y-2">
        {profiles.map(profile => (
          editingId === profile.id ? (
            <StoryProfileForm
              key={profile.id}
              type={type}
              profile={profile}
              onSave={(data) => handleUpdate(profile.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <Card key={profile.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-ui text-sm text-text-primary font-medium">
                    {profile.name}
                    {profile.relationship && <span className="text-text-muted font-normal"> ({profile.relationship})</span>}
                    {profile.nickname && <span className="text-text-muted font-normal"> &middot; &ldquo;{profile.nickname}&rdquo;</span>}
                  </p>
                  {Object.entries(profile.details || {}).filter(([, v]) => v).length > 0 && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {Object.entries(profile.details).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(profile.id)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(profile.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          )
        ))}

        {isAdding && (
          <StoryProfileForm
            type={type}
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
          />
        )}
      </div>
    </div>
  )
}
```

**Step 3: Update Settings page to include profiles**

In `app/(dashboard)/settings/page.tsx`, add the import and sections:

Add import at top:
```typescript
import { StoryProfileSection } from '@/components/settings/StoryProfileSection'
```

After the existing Account card (before closing `</div>` of space-y), add:

```tsx
        <Card>
          <h2 className="font-display text-base md:text-lg text-text-primary mb-4">Story Profiles</h2>
          <p className="text-xs text-text-muted mb-6">Add people and places so the AI gets your story right. These are used across all your novels.</p>
          <div className="space-y-6">
            <StoryProfileSection type="personal" title="Personal Info" description="Your own details for the protagonist" />
            <StoryProfileSection type="character" title="Characters" description="People in your life — family, friends, colleagues" />
            <StoryProfileSection type="location" title="Locations" description="Places that appear in your stories" />
          </div>
        </Card>
```

**Step 4: Commit**

```bash
git add components/settings/StoryProfileSection.tsx components/settings/StoryProfileForm.tsx app/(dashboard)/settings/page.tsx
git commit -m "feat: story profiles CRUD in settings — characters, locations, personal info"
```

---

## Task 13: Smart Profiles — Profile Scanner Utility

**Files:**
- Create: `lib/profile-scanner.ts`

**Step 1: Create the scanner**

Create `lib/profile-scanner.ts`:

```typescript
import type { StoryProfile } from '@/types'

// Common relationship keywords to detect in entry text
const RELATIONSHIP_PATTERNS: { pattern: RegExp; relationship: string }[] = [
  { pattern: /\bmy wife\b/i, relationship: 'wife' },
  { pattern: /\bmy husband\b/i, relationship: 'husband' },
  { pattern: /\bmy girlfriend\b/i, relationship: 'girlfriend' },
  { pattern: /\bmy boyfriend\b/i, relationship: 'boyfriend' },
  { pattern: /\bmy mom\b|\bmy mother\b/i, relationship: 'mother' },
  { pattern: /\bmy dad\b|\bmy father\b/i, relationship: 'father' },
  { pattern: /\bmy brother\b/i, relationship: 'brother' },
  { pattern: /\bmy sister\b/i, relationship: 'sister' },
  { pattern: /\bmy son\b/i, relationship: 'son' },
  { pattern: /\bmy daughter\b/i, relationship: 'daughter' },
  { pattern: /\bmy boss\b/i, relationship: 'boss' },
  { pattern: /\bmy friend\b/i, relationship: 'friend' },
  { pattern: /\bmy best friend\b/i, relationship: 'best friend' },
  { pattern: /\bmy colleague\b|\bmy coworker\b/i, relationship: 'colleague' },
  { pattern: /\bmy uncle\b/i, relationship: 'uncle' },
  { pattern: /\bmy aunt\b/i, relationship: 'aunt' },
  { pattern: /\bmy grandma\b|\bmy grandmother\b/i, relationship: 'grandmother' },
  { pattern: /\bmy grandpa\b|\bmy grandfather\b/i, relationship: 'grandfather' },
  { pattern: /\bmy partner\b/i, relationship: 'partner' },
  { pattern: /\bmy roommate\b/i, relationship: 'roommate' },
  { pattern: /\bour apartment\b|\bour house\b|\bour home\b/i, relationship: 'home' },
  { pattern: /\bmy office\b|\bthe office\b/i, relationship: 'office' },
]

export interface UnknownReference {
  keyword: string       // e.g. "my wife", "@Priya"
  relationship: string  // e.g. "wife", "unknown"
  type: 'character' | 'location'
}

/**
 * Scan entry text for @ mentions and relationship keywords
 * that don't match existing profiles.
 */
export function scanForUnknownReferences(
  text: string,
  existingProfiles: StoryProfile[]
): UnknownReference[] {
  const unknowns: UnknownReference[] = []
  const foundRelationships = new Set<string>()

  // 1. Check @ mentions
  const mentionRegex = /@(\w+)/g
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionName = match[1]
    const found = existingProfiles.find(
      p => p.name.toLowerCase() === mentionName.toLowerCase() ||
           p.nickname?.toLowerCase() === mentionName.toLowerCase()
    )
    if (!found) {
      unknowns.push({
        keyword: `@${mentionName}`,
        relationship: 'unknown',
        type: 'character',
      })
    }
  }

  // 2. Check relationship keywords
  for (const { pattern, relationship } of RELATIONSHIP_PATTERNS) {
    if (pattern.test(text)) {
      // Check if any existing profile has this relationship
      const isLocation = ['home', 'office'].includes(relationship)
      const found = existingProfiles.find(p => {
        if (isLocation) return p.type === 'location' && p.relationship === relationship
        return p.type === 'character' && p.relationship === relationship
      })

      if (!found && !foundRelationships.has(relationship)) {
        foundRelationships.add(relationship)
        unknowns.push({
          keyword: `my ${relationship}`,
          relationship,
          type: isLocation ? 'location' : 'character',
        })
      }
    }
  }

  return unknowns
}
```

**Step 2: Commit**

```bash
git add lib/profile-scanner.ts
git commit -m "feat: profile scanner to detect unknown character/location references in entries"
```

---

## Task 14: Smart Profiles — Pre-Generation Question Modal

**Files:**
- Create: `components/write/ProfileQuestionModal.tsx`

**Step 1: Create the modal component**

Create `components/write/ProfileQuestionModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { UnknownReference } from '@/lib/profile-scanner'

interface ProfileQuestionModalProps {
  unknowns: UnknownReference[]
  onComplete: (results: ProfileAnswer[]) => void
  onClose: () => void
}

export interface ProfileAnswer {
  keyword: string
  relationship: string
  type: 'character' | 'location'
  name: string
  nickname: string
  details: Record<string, string>
  skipped: boolean
}

export function ProfileQuestionModal({ unknowns, onComplete, onClose }: ProfileQuestionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<ProfileAnswer[]>([])
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [details, setDetails] = useState<Record<string, string>>({})

  const current = unknowns[currentIndex]
  if (!current) return null

  const isCharacter = current.type === 'character'

  function handleNext(skipped: boolean) {
    const answer: ProfileAnswer = {
      keyword: current.keyword,
      relationship: current.relationship,
      type: current.type,
      name: skipped ? '' : name,
      nickname: skipped ? '' : nickname,
      details: skipped ? {} : details,
      skipped,
    }

    const newAnswers = [...answers, answer]

    if (currentIndex + 1 >= unknowns.length) {
      onComplete(newAnswers)
    } else {
      setAnswers(newAnswers)
      setCurrentIndex(prev => prev + 1)
      setName('')
      setNickname('')
      setDetails({})
      setShowMore(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`You mentioned "${current.keyword}"`}
    >
      <p className="text-sm text-text-secondary mb-4">
        Help us get the details right. Fill in what you want — the AI will only use what you provide.
      </p>

      <div className="space-y-3">
        <Input
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isCharacter ? "What's their name?" : "What's this place called?"}
          autoFocus
        />

        {current.relationship !== 'unknown' && (
          <p className="text-xs text-text-muted">
            Relationship: <span className="text-text-secondary">{current.relationship}</span>
          </p>
        )}

        {isCharacter && (
          <Input
            label="Nickname (optional)"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="How you refer to them"
          />
        )}

        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="text-xs text-accent-primary hover:text-accent-primary/80 font-ui"
          >
            + Add more details
          </button>
        )}

        {showMore && (
          <div className="space-y-2 pt-1">
            {isCharacter ? (
              <>
                <Input label="Age" value={details.age || ''} onChange={e => setDetails(d => ({ ...d, age: e.target.value }))} placeholder="e.g. 28" />
                <Input label="Personality" value={details.personality || ''} onChange={e => setDetails(d => ({ ...d, personality: e.target.value }))} placeholder="e.g. cheerful, quiet, funny" />
                <Input label="Appearance" value={details.appearance || ''} onChange={e => setDetails(d => ({ ...d, appearance: e.target.value }))} placeholder="Brief description" />
                <Input label="Occupation" value={details.occupation || ''} onChange={e => setDetails(d => ({ ...d, occupation: e.target.value }))} placeholder="What do they do?" />
              </>
            ) : (
              <>
                <Input label="Type" value={details.type || ''} onChange={e => setDetails(d => ({ ...d, type: e.target.value }))} placeholder="e.g. apartment, cafe, park" />
                <Input label="Description" value={details.description || ''} onChange={e => setDetails(d => ({ ...d, description: e.target.value }))} placeholder="What's it like?" />
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <span className="text-xs text-text-muted">{currentIndex + 1} of {unknowns.length}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleNext(true)}>
            Skip — keep it vague
          </Button>
          <Button size="sm" onClick={() => handleNext(false)} disabled={!name.trim()}>
            {currentIndex + 1 >= unknowns.length ? 'Save & Generate' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

**Step 2: Commit**

```bash
git add components/write/ProfileQuestionModal.tsx
git commit -m "feat: pre-generation modal to collect unknown character/location details"
```

---

## Task 15: Smart Profiles — Wire Into Freeform Page

**Files:**
- Modify: `app/(dashboard)/write/freeform/page.tsx`

**Step 1: Integrate profile scanning and modal into freeform page**

Add imports at top of `app/(dashboard)/write/freeform/page.tsx`:

```typescript
import { scanForUnknownReferences, type UnknownReference } from '@/lib/profile-scanner'
import { ProfileQuestionModal, type ProfileAnswer } from '@/components/write/ProfileQuestionModal'
import type { StoryProfile } from '@/types'
```

Add state variables inside the component:

```typescript
  const [unknowns, setUnknowns] = useState<UnknownReference[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
```

Replace the `handleGenerate` function with a two-step flow:

```typescript
  async function handlePreGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setError('')

    // Fetch user's existing story profiles
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profiles } = await supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)

    const found = scanForUnknownReferences(rawEntry, (profiles as StoryProfile[]) || [])

    if (found.length > 0) {
      setUnknowns(found)
      setShowProfileModal(true)
    } else {
      await doGenerate()
    }
  }

  async function handleProfileAnswers(answers: ProfileAnswer[]) {
    setShowProfileModal(false)

    // Save non-skipped answers as profiles
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const toSave = answers.filter(a => !a.skipped && a.name.trim())
    if (toSave.length > 0) {
      await supabase.from('story_profiles').insert(
        toSave.map(a => ({
          user_id: user.id,
          type: a.type,
          name: a.name,
          relationship: a.relationship !== 'unknown' ? a.relationship : null,
          nickname: a.nickname || null,
          details: a.details,
        }))
      )
    }

    await doGenerate()
  }

  async function doGenerate() {
    if (!rawEntry.trim() || !novelId) return
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          rawEntry,
          entryDate,
          ...(isEditing && { chapterId }),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate chapter')
      }

      const { chapterId: resultChapterId } = await response.json()
      reset()
      router.push(`/novel/${novelId}/chapter/${resultChapterId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsGenerating(false)
    }
  }
```

Update the Generate button to call `handlePreGenerate`:

```
Old: <Button onClick={handleGenerate}
New: <Button onClick={handlePreGenerate}
```

Add the modal before the closing `</div>`:

```tsx
      {showProfileModal && (
        <ProfileQuestionModal
          unknowns={unknowns}
          onComplete={handleProfileAnswers}
          onClose={() => setShowProfileModal(false)}
        />
      )}
```

**Step 2: Commit**

```bash
git add app/(dashboard)/write/freeform/page.tsx
git commit -m "feat: wire profile scanning and question modal into write flow"
```

---

## Task 16: Smart Profiles — AI Prompt Integration

**Files:**
- Modify: `lib/ai/prompts.ts`
- Modify: `app/api/generate-chapter/route.ts`

**Step 1: Update prompt builder to accept profiles**

In `lib/ai/prompts.ts`, update the function signature and add profile context:

```typescript
import type { Novel, Chapter, StoryProfile } from '@/types'

export function buildChapterPrompt(
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  chapterNumber: number,
  volumeNumber: number,
  year: number,
  recentChapters: Pick<Chapter, 'title' | 'content' | 'mood' | 'chapter_number'>[],
  storyProfiles: StoryProfile[] = []
): { system: string; user: string } {
```

Build the profile context string. Add this before the `system` string construction:

```typescript
  // Build profile context
  let profileContext = ''
  const personal = storyProfiles.filter(p => p.type === 'personal')
  const characters = storyProfiles.filter(p => p.type === 'character')
  const locations = storyProfiles.filter(p => p.type === 'location')

  if (storyProfiles.length > 0) {
    profileContext = '\nCHARACTER & LOCATION REFERENCE:\n'

    if (personal.length > 0) {
      profileContext += 'Protagonist details:\n'
      personal.forEach(p => {
        const dets = Object.entries(p.details || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        profileContext += `- ${p.name}${dets ? ` (${dets})` : ''}\n`
      })
    }

    if (characters.length > 0) {
      profileContext += 'People:\n'
      characters.forEach(p => {
        const dets = Object.entries(p.details || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        const rel = p.relationship ? ` (${p.relationship})` : ''
        const nick = p.nickname ? ` aka "${p.nickname}"` : ''
        profileContext += `- ${p.name}${rel}${nick}${dets ? `: ${dets}` : ''}\n`
      })
    }

    if (locations.length > 0) {
      profileContext += 'Locations:\n'
      locations.forEach(p => {
        const dets = Object.entries(p.details || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        profileContext += `- ${p.name}${dets ? `: ${dets}` : ''}\n`
      })
    }

    profileContext += `
STRICT RULES ABOUT CHARACTERS AND PLACES:
- Use ONLY the names and details listed in the CHARACTER & LOCATION REFERENCE above
- NEVER invent names, ages, appearances, or personal details for anyone
- If a person is NOT in the reference, refer to them ONLY by their relationship ("his wife", "her friend") — do NOT create a name
- If a place is NOT in the reference, use generic descriptions only
`
  }
```

Insert `profileContext` into the system prompt after the RECENT CHAPTERS section:

```
Old: INSTRUCTIONS:
New: ${profileContext}
INSTRUCTIONS:
```

**Step 2: Update API route to fetch and pass profiles**

In `app/api/generate-chapter/route.ts`, add profile fetching before the prompt building:

```typescript
    // Fetch user's story profiles
    const { data: storyProfiles } = await supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)
```

Update the `buildChapterPrompt` call to pass profiles:

```
Old: const { system, user: userPrompt } = buildChapterPrompt(
       novel, rawEntry, entryDate, chapterNumber,
       volume?.volume_number || 1, entryYear, recentChapters || []
     )
New: const { system, user: userPrompt } = buildChapterPrompt(
       novel, rawEntry, entryDate, chapterNumber,
       volume?.volume_number || 1, entryYear, recentChapters || [],
       storyProfiles || []
     )
```

**Step 3: Commit**

```bash
git add lib/ai/prompts.ts app/api/generate-chapter/route.ts
git commit -m "feat: inject story profiles into AI prompt with strict no-invention rules"
```

---

## Task 17: Smart Profiles — @ Mention Dropdown in Editor

**Files:**
- Modify: `components/write/FreeformEditor.tsx`

**Step 1: Add @ mention support to the editor**

This is the most complex UI piece. Replace `components/write/FreeformEditor.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useWriteStore } from '@/stores/write-store'
import { createClient } from '@/lib/supabase/client'
import type { StoryProfile } from '@/types'

export function FreeformEditor() {
  const { rawEntry, setRawEntry } = useWriteStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [profiles, setProfiles] = useState<StoryProfile[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownFilter, setDropdownFilter] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [mentionStart, setMentionStart] = useState<number>(-1)

  // Load profiles once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('story_profiles')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setProfiles(data)
        })
    })
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, 300)}px`
    }
  }, [rawEntry])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setRawEntry(value)

    // Check if we're in an @mention
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex >= 0) {
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
      const textAfterAt = textBeforeCursor.slice(atIndex + 1)

      // @ must be at start or after whitespace, and no spaces in the mention text
      if ((charBefore === ' ' || charBefore === '\n' || atIndex === 0) && !/\s/.test(textAfterAt)) {
        setMentionStart(atIndex)
        setDropdownFilter(textAfterAt.toLowerCase())
        setShowDropdown(true)
        return
      }
    }

    setShowDropdown(false)
  }

  function handleSelect(profile: StoryProfile) {
    if (mentionStart < 0) return
    const before = rawEntry.slice(0, mentionStart)
    const after = rawEntry.slice(textareaRef.current?.selectionStart || mentionStart)
    const mention = `@${profile.nickname || profile.name} `
    setRawEntry(before + mention + after)
    setShowDropdown(false)

    // Refocus textarea
    setTimeout(() => {
      const pos = (before + mention).length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(dropdownFilter) ||
    (p.nickname && p.nickname.toLowerCase().includes(dropdownFilter)) ||
    (p.relationship && p.relationship.toLowerCase().includes(dropdownFilter))
  )

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={rawEntry}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (showDropdown && e.key === 'Escape') {
            setShowDropdown(false)
          }
        }}
        placeholder="Tell me about your day... Use @ to mention people and places."
        className="w-full min-h-[250px] md:min-h-[300px] bg-transparent font-body text-base md:text-lg text-text-primary leading-relaxed placeholder:text-text-muted/50 resize-none focus:outline-none"
      />

      {showDropdown && filteredProfiles.length > 0 && (
        <div className="absolute z-20 mt-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-ink-border bg-ink-card shadow-lg">
          {filteredProfiles.map(profile => (
            <button
              key={profile.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(profile) }}
              className="w-full text-left px-3 py-2 hover:bg-ink-surface transition-colors"
            >
              <p className="text-sm font-ui text-text-primary">
                {profile.name}
                {profile.relationship && (
                  <span className="text-text-muted"> ({profile.relationship})</span>
                )}
              </p>
              {profile.nickname && (
                <p className="text-xs text-text-muted">&ldquo;{profile.nickname}&rdquo;</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/write/FreeformEditor.tsx
git commit -m "feat: @ mention dropdown in freeform editor for quick character/location references"
```

---

## Task 18: Final Build Verification

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors. Warnings about ESLint v8 deprecation are fine.

**Step 2: Manual testing checklist**

- [ ] PWA: Open on phone, add to homescreen — quill icon shows
- [ ] Mobile: All pages look compact on Samsung S23 (393dp)
- [ ] Loading: Generation shows typewriter cycling through facts/quotes
- [ ] Edit: Chapter reader has "Edit Entry" link — leads to pre-filled editor
- [ ] Regenerate: Editing and regenerating updates the chapter in-place
- [ ] Profiles: Settings page shows Characters/Locations/Personal sections
- [ ] Profiles: Adding a new character profile works
- [ ] Scanner: Writing "my wife" triggers the question modal on generate
- [ ] Skip: Clicking "Skip — keep it vague" generates without inventing details
- [ ] @ Mentions: Typing @ in editor shows dropdown of profiles
- [ ] AI: Generated chapter uses correct profile names, never invents details

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: phase 2 improvements complete — mobile, loading, edit, profiles"
```

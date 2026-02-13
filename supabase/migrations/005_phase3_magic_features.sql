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

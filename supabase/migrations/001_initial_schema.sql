-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_theme TEXT DEFAULT 'leather-dark',
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOVELS
-- ============================================
CREATE TABLE novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  character_name TEXT NOT NULL DEFAULT 'the protagonist',
  genre TEXT NOT NULL DEFAULT 'literary',
  pov TEXT NOT NULL DEFAULT 'first',
  writing_style TEXT NOT NULL DEFAULT 'modern',
  cover_image_url TEXT,
  cover_prompt TEXT,
  start_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOLUMES
-- ============================================
CREATE TABLE volumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  volume_number INTEGER NOT NULL,
  title TEXT,
  prologue TEXT,
  epilogue TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, year)
);

-- ============================================
-- CHAPTERS
-- ============================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  volume_id UUID REFERENCES volumes(id) ON DELETE SET NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  raw_entry TEXT NOT NULL,
  entry_mode TEXT NOT NULL DEFAULT 'freeform',
  entry_date DATE NOT NULL,
  mood TEXT,
  mood_score FLOAT,
  tags TEXT[] DEFAULT '{}',
  opening_quote TEXT,
  illustration_url TEXT,
  soundtrack_suggestion TEXT,
  is_bookmarked BOOLEAN DEFAULT false,
  is_summary BOOLEAN DEFAULT false,
  summary_type TEXT,
  word_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_chapters_novel_date ON chapters(novel_id, entry_date);
CREATE INDEX idx_chapters_tags ON chapters USING GIN(tags);
CREATE INDEX idx_chapters_mood ON chapters(novel_id, mood_score);
CREATE INDEX idx_volumes_novel ON volumes(novel_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own profiles" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own novels" ON novels
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own volumes" ON volumes
  FOR ALL USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));

CREATE POLICY "Users own chapters" ON chapters
  FOR ALL USING (novel_id IN (SELECT id FROM novels WHERE user_id = auth.uid()));

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

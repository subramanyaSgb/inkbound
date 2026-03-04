-- 009_daily_entries.sql
-- Daily entries: decouple journal writing from chapter generation

CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL,
  entry_mode TEXT NOT NULL DEFAULT 'freeform',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'archived')),
  word_count INTEGER NOT NULL DEFAULT 0,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_auto_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One entry per day per novel
CREATE UNIQUE INDEX idx_daily_entries_novel_date ON daily_entries(novel_id, entry_date);

-- Fast lookups by user + status (for entries page)
CREATE INDEX idx_daily_entries_user_status ON daily_entries(user_id, status);

-- Fast lookups by novel (for recent entries on write page)
CREATE INDEX idx_daily_entries_novel_id ON daily_entries(novel_id, entry_date DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_daily_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_entries_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_entries_updated_at();

-- RLS
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON daily_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON daily_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON daily_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON daily_entries FOR DELETE
  USING (auth.uid() = user_id);

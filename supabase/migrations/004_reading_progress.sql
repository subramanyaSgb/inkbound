-- ============================================
-- READING PROGRESS TRACKING
-- ============================================
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  novel_id UUID REFERENCES novels(id) ON DELETE CASCADE NOT NULL,
  last_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  chapters_read INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reading progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id);

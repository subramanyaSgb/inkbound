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

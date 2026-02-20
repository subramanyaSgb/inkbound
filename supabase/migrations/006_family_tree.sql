-- Family Tree: profile_relationships edge table
CREATE TABLE profile_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_profile_id UUID REFERENCES story_profiles(id) ON DELETE CASCADE NOT NULL,
  to_profile_id UUID REFERENCES story_profiles(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'parent', 'sibling', 'spouse', 'friend', 'colleague', 'mentor'
  )),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_profile_id, to_profile_id, relationship_type)
);

CREATE INDEX idx_profile_relationships_user ON profile_relationships(user_id);
CREATE INDEX idx_profile_relationships_from ON profile_relationships(from_profile_id);
CREATE INDEX idx_profile_relationships_to ON profile_relationships(to_profile_id);

ALTER TABLE profile_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own relationships"
  ON profile_relationships FOR ALL
  USING (auth.uid() = user_id);

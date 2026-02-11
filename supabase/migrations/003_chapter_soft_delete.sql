-- ============================================
-- SOFT DELETE FOR CHAPTERS (recycle bin)
-- ============================================
ALTER TABLE chapters ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_chapters_deleted ON chapters(novel_id, deleted_at);

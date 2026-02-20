-- Add status column to chapters table for async generation tracking
-- Values: 'generating' (AI in progress), 'completed' (done), 'failed' (error)
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- All existing chapters are already complete
-- New chapters will be inserted with 'generating' and updated to 'completed'/'failed'

-- Index for efficient queries on novel page (find generating chapters)
CREATE INDEX IF NOT EXISTS idx_chapters_novel_status ON chapters(novel_id, status);

-- Allow NULL content in chapters for async two-step generation
-- Chapters are created with content=NULL and status='generating',
-- then updated with actual content once AI generation completes.
ALTER TABLE chapters ALTER COLUMN content DROP NOT NULL;

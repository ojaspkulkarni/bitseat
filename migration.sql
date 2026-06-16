-- ─── Bitseat DB migration ──────────────────────────────────────────────────
-- Rename test_date → session2_shift, add session1_shift

ALTER TABLE scores
  RENAME COLUMN test_date TO session2_shift;

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS session1_shift TEXT;

-- Optional: index for shift-based queries
CREATE INDEX IF NOT EXISTS idx_scores_session1_shift ON scores (session1_shift);
CREATE INDEX IF NOT EXISTS idx_scores_session2_shift ON scores (session2_shift);

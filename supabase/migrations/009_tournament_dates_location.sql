-- =====================================================
-- Goal Digger — Add date range & location to tournaments
-- =====================================================

ALTER TABLE tournaments
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date   DATE,
  ADD COLUMN location   TEXT;

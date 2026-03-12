-- =====================================================
-- Goal Digger — Player Ratings Migration
-- Run this in Supabase Dashboard > SQL Editor
-- OR via: supabase db push
-- =====================================================

-- ─────────────────────────────────────────────
-- PLAYER RATINGS
-- ─────────────────────────────────────────────
CREATE TABLE player_ratings (
  rater_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ratee_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating >= 30 AND rating <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rater_id, ratee_id),
  CONSTRAINT self_rating_check CHECK (rater_id != ratee_id)
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select_all"  ON player_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_self" ON player_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "ratings_update_self" ON player_ratings FOR UPDATE USING (auth.uid() = rater_id) WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "ratings_delete_self" ON player_ratings FOR DELETE USING (auth.uid() = rater_id);

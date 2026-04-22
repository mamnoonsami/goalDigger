-- =====================================================
-- Goal Digger — Tournament Matches & Stats
-- =====================================================

-- ─────────────────────────────────────────────
-- TOURNAMENT MATCHES
-- ─────────────────────────────────────────────
CREATE TABLE tournament_matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id        UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_1_id            UUID NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  team_2_id            UUID NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  team_1_score         INTEGER NOT NULL DEFAULT 0,
  team_2_score         INTEGER NOT NULL DEFAULT 0,
  match_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status               TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' or 'completed'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Validation to ensure teams don't play themselves in the same match record
  CONSTRAINT different_teams CHECK (team_1_id != team_2_id)
);

-- ─────────────────────────────────────────────
-- TOURNAMENT MATCH STATS (Player Goals)
-- ─────────────────────────────────────────────
CREATE TABLE tournament_match_stats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_match_id  UUID NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
  player_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id              UUID NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  goals                INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_match_id, player_id)
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_tournament_matches_tourn  ON tournament_matches(tournament_id);
CREATE INDEX idx_tms_match                 ON tournament_match_stats(tournament_match_id);
CREATE INDEX idx_tms_player                ON tournament_match_stats(player_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- tournament_matches
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournament_matches_select" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "tournament_matches_insert_admin" ON tournament_matches FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tournament_matches_update_admin" ON tournament_matches FOR UPDATE USING (is_admin());
CREATE POLICY "tournament_matches_delete_admin" ON tournament_matches FOR DELETE USING (is_admin());

-- tournament_match_stats
ALTER TABLE tournament_match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tms_select" ON tournament_match_stats FOR SELECT USING (true);
CREATE POLICY "tms_insert_admin" ON tournament_match_stats FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tms_update_admin" ON tournament_match_stats FOR UPDATE USING (is_admin());
CREATE POLICY "tms_delete_admin" ON tournament_match_stats FOR DELETE USING (is_admin());

-- ─────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_match_stats;

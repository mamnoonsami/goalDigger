-- =====================================================
-- Goal Digger — Allow managers to create teams in tournaments
-- =====================================================

-- Managers can create teams (setting themselves as manager)
CREATE POLICY "tt_insert_manager" ON tournament_teams
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

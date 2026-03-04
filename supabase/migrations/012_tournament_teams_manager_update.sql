-- =====================================================
-- Goal Digger — Allow managers to update their own teams
-- =====================================================

CREATE POLICY "tt_update_manager_own" ON tournament_teams
  FOR UPDATE USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

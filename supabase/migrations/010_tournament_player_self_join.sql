-- =====================================================
-- Goal Digger — Allow players to self-join/leave tournaments
-- =====================================================

-- Players can insert themselves into a tournament
CREATE POLICY "tp_insert_player_self" ON tournament_players
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Players can remove themselves from a tournament
CREATE POLICY "tp_delete_player_self" ON tournament_players
  FOR DELETE USING (auth.uid() = player_id);

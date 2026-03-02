-- =====================================================
-- Goal Digger — Tournament Schema Alterations
-- Modifies existing tournaments & tournament_players,
-- adds tournament_teams, auction ↔ tournament link,
-- and new status enum.
-- =====================================================

-- ─────────────────────────────────────────────
-- STATUS ENUM
-- ─────────────────────────────────────────────
CREATE TYPE tournament_status AS ENUM (
  'draft',
  'auction',
  'active',
  'completed'
);

-- ─────────────────────────────────────────────
-- ALTER: tournaments
--   • Drop: budget_per_manager, auction_start_at, auction_end_at
--   • Change: status TEXT → tournament_status ENUM
--   • Add: auction_id FK → auctions
-- ─────────────────────────────────────────────
ALTER TABLE tournaments
  DROP COLUMN IF EXISTS budget_per_manager,
  DROP COLUMN IF EXISTS auction_start_at,
  DROP COLUMN IF EXISTS auction_end_at;

-- Convert status from TEXT to the new enum
ALTER TABLE tournaments
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE tournaments
  ALTER COLUMN status TYPE tournament_status
  USING status::tournament_status;

ALTER TABLE tournaments
  ALTER COLUMN status SET DEFAULT 'draft';

-- Add auction link
ALTER TABLE tournaments
  ADD COLUMN auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- NEW TABLE: tournament_teams
-- Each team belongs to a tournament and is
-- managed by one manager.
-- ─────────────────────────────────────────────
CREATE TABLE tournament_teams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id     UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name         TEXT NOT NULL,
  team_slogan       TEXT,
  manager_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  number_of_players INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ALTER: tournament_players
--   • Drop: base_price, sold_to, sold_price
--   • Add: team_id FK → tournament_teams
-- ─────────────────────────────────────────────
ALTER TABLE tournament_players
  DROP COLUMN IF EXISTS base_price,
  DROP COLUMN IF EXISTS sold_to,
  DROP COLUMN IF EXISTS sold_price;

ALTER TABLE tournament_players
  ADD COLUMN team_id UUID REFERENCES tournament_teams(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- ALTER: auctions — link back to tournament
-- ─────────────────────────────────────────────
ALTER TABLE auctions
  ADD COLUMN tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tournaments_auction       ON tournaments(auction_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status        ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tourn    ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_mgr      ON tournament_teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_team   ON tournament_players(team_id);
CREATE INDEX IF NOT EXISTS idx_auctions_tournament       ON auctions(tournament_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tt_select_all" ON tournament_teams FOR SELECT USING (true);
CREATE POLICY "tt_insert_admin" ON tournament_teams FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "tt_update_admin" ON tournament_teams FOR UPDATE
  USING (is_admin());
CREATE POLICY "tt_delete_admin" ON tournament_teams FOR DELETE
  USING (is_admin());

-- ─────────────────────────────────────────────
-- REALTIME — enable for live updates
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_players;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_teams;

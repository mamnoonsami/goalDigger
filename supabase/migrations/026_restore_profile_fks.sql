-- =====================================================
-- Goal Digger — Restore Foreign Keys to profiles(id)
--
-- Migration 025 used DROP CONSTRAINT ... CASCADE on the
-- profiles primary key, which cascaded and dropped ALL
-- foreign keys from other tables that referenced
-- profiles(id). This migration restores them.
-- =====================================================

-- ─────────────────────────────────────────────
-- 001_initial_schema.sql FKs
-- ─────────────────────────────────────────────

-- matches.created_by → profiles(id)
ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_created_by_fkey;
ALTER TABLE matches
  ADD CONSTRAINT matches_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- match_signups.player_id → profiles(id)
ALTER TABLE match_signups
  DROP CONSTRAINT IF EXISTS match_signups_player_id_fkey;
ALTER TABLE match_signups
  ADD CONSTRAINT match_signups_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- match_stats.player_id → profiles(id)
ALTER TABLE match_stats
  DROP CONSTRAINT IF EXISTS match_stats_player_id_fkey;
ALTER TABLE match_stats
  ADD CONSTRAINT match_stats_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- match_stats.recorded_by → profiles(id)
ALTER TABLE match_stats
  DROP CONSTRAINT IF EXISTS match_stats_recorded_by_fkey;
ALTER TABLE match_stats
  ADD CONSTRAINT match_stats_recorded_by_fkey
  FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- tournaments.created_by → profiles(id)
ALTER TABLE tournaments
  DROP CONSTRAINT IF EXISTS tournaments_created_by_fkey;
ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- tournament_players.player_id → profiles(id)
ALTER TABLE tournament_players
  DROP CONSTRAINT IF EXISTS tournament_players_player_id_fkey;
ALTER TABLE tournament_players
  ADD CONSTRAINT tournament_players_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- tournament_players.sold_to → profiles(id)
-- (column was dropped in migration 008, safe to skip if it doesn't exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'tournament_players' AND column_name = 'sold_to') THEN
    ALTER TABLE tournament_players
      DROP CONSTRAINT IF EXISTS tournament_players_sold_to_fkey;
    ALTER TABLE tournament_players
      ADD CONSTRAINT tournament_players_sold_to_fkey
      FOREIGN KEY (sold_to) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- bids.manager_id → profiles(id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'bids') THEN
    ALTER TABLE bids
      DROP CONSTRAINT IF EXISTS bids_manager_id_fkey;
    ALTER TABLE bids
      ADD CONSTRAINT bids_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 005_auction_tables.sql FKs
-- ─────────────────────────────────────────────

-- auctions.created_by → profiles(id)
ALTER TABLE auctions
  DROP CONSTRAINT IF EXISTS auctions_created_by_fkey;
ALTER TABLE auctions
  ADD CONSTRAINT auctions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- auction_players.player_id → profiles(id)
ALTER TABLE auction_players
  DROP CONSTRAINT IF EXISTS auction_players_player_id_fkey;
ALTER TABLE auction_players
  ADD CONSTRAINT auction_players_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- auction_players.sold_to → profiles(id)
ALTER TABLE auction_players
  DROP CONSTRAINT IF EXISTS auction_players_sold_to_fkey;
ALTER TABLE auction_players
  ADD CONSTRAINT auction_players_sold_to_fkey
  FOREIGN KEY (sold_to) REFERENCES profiles(id) ON DELETE SET NULL;

-- auction_bids.manager_id → profiles(id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'auction_bids') THEN
    ALTER TABLE auction_bids
      DROP CONSTRAINT IF EXISTS auction_bids_manager_id_fkey;
    ALTER TABLE auction_bids
      ADD CONSTRAINT auction_bids_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 006_auction_managers.sql FKs
-- ─────────────────────────────────────────────

-- auction_managers.manager_id → profiles(id)
ALTER TABLE auction_managers
  DROP CONSTRAINT IF EXISTS auction_managers_manager_id_fkey;
ALTER TABLE auction_managers
  ADD CONSTRAINT auction_managers_manager_id_fkey
  FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────
-- 008_tournament_tables.sql FKs
-- ─────────────────────────────────────────────

-- tournament_teams.manager_id → profiles(id)
ALTER TABLE tournament_teams
  DROP CONSTRAINT IF EXISTS tournament_teams_manager_id_fkey;
ALTER TABLE tournament_teams
  ADD CONSTRAINT tournament_teams_manager_id_fkey
  FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- 016_player_ratings.sql FKs
-- ─────────────────────────────────────────────

-- player_ratings.rater_id → profiles(id)
ALTER TABLE player_ratings
  DROP CONSTRAINT IF EXISTS player_ratings_rater_id_fkey;
ALTER TABLE player_ratings
  ADD CONSTRAINT player_ratings_rater_id_fkey
  FOREIGN KEY (rater_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- player_ratings.ratee_id → profiles(id)
ALTER TABLE player_ratings
  DROP CONSTRAINT IF EXISTS player_ratings_ratee_id_fkey;
ALTER TABLE player_ratings
  ADD CONSTRAINT player_ratings_ratee_id_fkey
  FOREIGN KEY (ratee_id) REFERENCES profiles(id) ON DELETE CASCADE;

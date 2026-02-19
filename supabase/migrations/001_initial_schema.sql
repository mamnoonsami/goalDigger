-- =====================================================
-- Goal Digger — Initial Schema Migration
-- Run this in Supabase Dashboard > SQL Editor
-- OR via: supabase db push
-- =====================================================

-- ─────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────
CREATE TYPE user_roles    AS ENUM ('admin', 'manager', 'player', 'viewer');
CREATE TYPE match_status AS ENUM ('open', 'balanced', 'in_progress', 'completed', 'cancelled');
CREATE TYPE positions     AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');
CREATE TYPE bid_status   AS ENUM ('active', 'won', 'outbid', 'cancelled');

-- ─────────────────────────────────────────────
-- PROFILES  (one-to-one with auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  avatar_url     TEXT,
  role           user_roles NOT NULL DEFAULT 'viewer',
  is_admin       boolean NOT NULL DEFAULT false,
  is_player      boolean NOT NULL DEFAULT false,
  is_manager     boolean NOT NULL DEFAULT false,
  is_viewer      boolean NOT NULL DEFAULT true,
  player_position positions,
  -- Admin-assigned base score (1–100). Defaults to 50 (average player).
  base_score     INTEGER NOT NULL DEFAULT 50 CHECK (base_score BETWEEN 1 AND 100),
  -- Career stats — incremented atomically after each match
  goals          INTEGER NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  -- Effective score (computed on read) = base_score + goals * 2
  -- Budget for the auction module (managers only)
  auction_budget INTEGER NOT NULL DEFAULT 1000,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Player'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- MATCHES
-- ─────────────────────────────────────────────
CREATE TABLE matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  location       TEXT,
  status         match_status NOT NULL DEFAULT 'open',
  max_players    INTEGER NOT NULL DEFAULT 20,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MATCH SIGNUPS  (many-to-many: players ↔ matches)
-- ─────────────────────────────────────────────
CREATE TABLE match_signups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team         SMALLINT CHECK (team IN (1, 2)),  -- assigned after balancing
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- ─────────────────────────────────────────────
-- MATCH STATS  (per-player, per-match record)
-- ─────────────────────────────────────────────
CREATE TABLE match_stats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goals       INTEGER NOT NULL DEFAULT 0,
  assists     INTEGER NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- ─────────────────────────────────────────────
-- TOURNAMENTS
-- ─────────────────────────────────────────────
CREATE TABLE tournaments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  description        TEXT,
  auction_start_at   TIMESTAMPTZ,
  auction_end_at     TIMESTAMPTZ,
  budget_per_manager INTEGER NOT NULL DEFAULT 1000,
  status             TEXT NOT NULL DEFAULT 'draft',  -- draft|auction|active|completed
  created_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TOURNAMENT PLAYERS  (player slots listed for auction)
-- ─────────────────────────────────────────────
CREATE TABLE tournament_players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  base_price     INTEGER NOT NULL DEFAULT 100,
  sold_to        UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- winning manager
  sold_price     INTEGER,
  UNIQUE(tournament_id, player_id)
);

-- ─────────────────────────────────────────────
-- BIDS
-- ─────────────────────────────────────────────
CREATE TABLE bids (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id        UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  tournament_player_id UUID NOT NULL REFERENCES tournament_players(id) ON DELETE CASCADE,
  manager_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount               INTEGER NOT NULL CHECK (amount > 0),
  status               bid_status NOT NULL DEFAULT 'active',
  placed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX ON match_signups(match_id);
CREATE INDEX ON match_signups(player_id);
CREATE INDEX ON match_stats(match_id);
CREATE INDEX ON match_stats(player_id);
CREATE INDEX ON bids(tournament_player_id, placed_at DESC);
CREATE INDEX ON bids(manager_id);
CREATE INDEX ON bids(tournament_id);

-- ─────────────────────────────────────────────
-- DB FUNCTION: atomic goal/match counter increment
-- Called by match.service.ts via supabase.rpc()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_player_goals(pid UUID, g INTEGER)
RETURNS VOID AS $$
  UPDATE profiles
  SET
    goals          = goals + g,
    matches_played = matches_played + 1,
    updated_at     = NOW()
  WHERE id = pid;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Helper: get current user's role from profiles
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_roles AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self_or_admin" ON profiles FOR UPDATE
  USING (auth.uid() = id OR auth_role() = 'admin');

-- MATCHES
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_select_all" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert"     ON matches FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'manager'));
CREATE POLICY "matches_update"     ON matches FOR UPDATE
  USING (auth_role() IN ('admin', 'manager'));

-- MATCH SIGNUPS
ALTER TABLE match_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signups_select_all"   ON match_signups FOR SELECT USING (true);
CREATE POLICY "signups_insert_self"  ON match_signups FOR INSERT
  WITH CHECK (auth.uid() = player_id);
CREATE POLICY "signups_delete_self"  ON match_signups FOR DELETE
  USING (auth.uid() = player_id);
CREATE POLICY "signups_update_admin" ON match_signups FOR UPDATE
  USING (auth_role() = 'admin');

-- MATCH STATS
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_select_all" ON match_stats FOR SELECT USING (true);
CREATE POLICY "stats_write_admin" ON match_stats FOR ALL
  USING (auth_role() = 'admin');

-- TOURNAMENTS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments_select_all" ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_write"      ON tournaments FOR ALL
  USING (auth_role() IN ('admin', 'manager'));

-- TOURNAMENT PLAYERS
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tp_select_all" ON tournament_players FOR SELECT USING (true);
CREATE POLICY "tp_write_admin" ON tournament_players FOR ALL
  USING (auth_role() = 'admin');

-- BIDS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bids_select_all"    ON bids FOR SELECT USING (true);
CREATE POLICY "bids_insert_manager" ON bids FOR INSERT
  WITH CHECK (auth.uid() = manager_id AND auth_role() = 'manager');
CREATE POLICY "bids_update_admin"  ON bids FOR UPDATE
  USING (auth_role() = 'admin');

-- =====================================================
-- Goal Digger — Auction Tables Migration
-- Auctions are separate from Tournaments.
-- Deleting an auction CASCADE deletes players & bids.
-- =====================================================

-- ─────────────────────────────────────────────
-- AUCTIONS (the event itself)
-- ─────────────────────────────────────────────
CREATE TABLE auctions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT,                          -- rules / description
  scheduled_at       TIMESTAMPTZ NOT NULL,
  bid_timer_seconds  INTEGER NOT NULL DEFAULT 15,   -- countdown between bids
  budget_per_manager INTEGER NOT NULL DEFAULT 1000,
  status             TEXT NOT NULL DEFAULT 'draft',  -- draft | live | completed
  created_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUCTION PLAYERS (players listed for auction)
-- Cascade: deleting an auction removes its players
-- ─────────────────────────────────────────────
CREATE TABLE auction_players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id     UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  base_price     INTEGER NOT NULL DEFAULT 100,
  sold_to        UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- winning manager
  sold_price     INTEGER,
  status         TEXT NOT NULL DEFAULT 'pending',  -- pending | bidding | sold | unsold
  display_order  INTEGER,                          -- tracks spin order
  UNIQUE(auction_id, player_id)
);

-- ─────────────────────────────────────────────
-- AUCTION BIDS (bid history)
-- Cascade: deleting an auction removes its bids
-- Also cascade from auction_players
-- ─────────────────────────────────────────────
CREATE TABLE auction_bids (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id        UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  auction_player_id UUID NOT NULL REFERENCES auction_players(id) ON DELETE CASCADE,
  manager_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount            INTEGER NOT NULL CHECK (amount > 0),
  status            bid_status NOT NULL DEFAULT 'active',  -- reuses existing enum
  placed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_auction_players_auction   ON auction_players(auction_id);
CREATE INDEX idx_auction_players_player    ON auction_players(player_id);
CREATE INDEX idx_auction_bids_player_time  ON auction_bids(auction_player_id, placed_at DESC);
CREATE INDEX idx_auction_bids_manager      ON auction_bids(manager_id);
CREATE INDEX idx_auction_bids_auction      ON auction_bids(auction_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- AUCTIONS
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auctions_select_all" ON auctions FOR SELECT USING (true);
CREATE POLICY "auctions_insert_admin" ON auctions FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "auctions_update_admin" ON auctions FOR UPDATE
  USING (is_admin());
CREATE POLICY "auctions_delete_admin" ON auctions FOR DELETE
  USING (is_admin());

-- AUCTION PLAYERS
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ap_select_all" ON auction_players FOR SELECT USING (true);
CREATE POLICY "ap_write_admin" ON auction_players FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "ap_update_admin" ON auction_players FOR UPDATE
  USING (is_admin());
CREATE POLICY "ap_delete_admin" ON auction_players FOR DELETE
  USING (is_admin());

-- AUCTION BIDS
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ab_select_all" ON auction_bids FOR SELECT USING (true);
CREATE POLICY "ab_insert_manager" ON auction_bids FOR INSERT
  WITH CHECK (auth.uid() = manager_id AND is_manager());
CREATE POLICY "ab_update_admin" ON auction_bids FOR UPDATE
  USING (is_admin());

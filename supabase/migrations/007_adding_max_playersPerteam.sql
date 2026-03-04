-- Add max_players_per_team to auctions table
ALTER TABLE auctions ADD COLUMN max_players_per_team INTEGER NOT NULL DEFAULT 8;

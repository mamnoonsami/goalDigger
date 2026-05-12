-- Add assists column to tournament_match_stats
ALTER TABLE tournament_match_stats
ADD COLUMN assists INTEGER NOT NULL DEFAULT 0;

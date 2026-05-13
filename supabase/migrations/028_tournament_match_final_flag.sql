-- Mark one tournament match as the final.
ALTER TABLE tournament_matches
ADD COLUMN IF NOT EXISTS is_final BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_matches_one_final
ON tournament_matches(tournament_id)
WHERE is_final = TRUE;

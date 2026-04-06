-- Safely replace the positions enum to remove 'forward' and add 'striker'
BEGIN;

ALTER TYPE positions RENAME TO positions_old;

CREATE TYPE positions AS ENUM ('goalkeeper', 'defender', 'midfielder', 'striker');

ALTER TABLE profiles 
  ALTER COLUMN player_position TYPE positions 
  USING (
    CASE 
      WHEN player_position::text = 'forward' THEN 'striker'::positions
      WHEN player_position IS NULL THEN NULL
      ELSE player_position::text::positions 
    END
  );

DROP TYPE positions_old;

COMMIT;

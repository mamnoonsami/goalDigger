-- =====================================================
-- Goal Digger — Auction Status Trigger
-- Automatically assigns/unassigns players when an auction
-- is marked as completed or un-completed.
-- =====================================================

CREATE OR REPLACE FUNCTION process_auction_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures the trigger runs with db-owner privileges, bypassing RLS
SET search_path = public
AS $$
BEGIN
  -- If transitioning to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.tournament_id IS NOT NULL THEN
    
    -- Update tournament_players team_id based on sold_to == manager_id
    UPDATE tournament_players tp
    SET team_id = tt.id
    FROM auction_players ap
    JOIN tournament_teams tt ON tt.manager_id = ap.sold_to AND tt.tournament_id = NEW.tournament_id
    WHERE tp.tournament_id = NEW.tournament_id
      AND ap.auction_id = NEW.id
      AND ap.player_id = tp.player_id
      AND ap.status = 'sold'
      AND ap.sold_to IS NOT NULL;

  -- If transitioning away from 'completed'
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' AND NEW.tournament_id IS NOT NULL THEN
    
    -- Unassign team_id for players in this auction
    UPDATE tournament_players tp
    SET team_id = NULL
    FROM auction_players ap
    WHERE tp.tournament_id = NEW.tournament_id
      AND ap.auction_id = NEW.id
      AND ap.player_id = tp.player_id;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auction_status_change ON auctions;
CREATE TRIGGER trg_auction_status_change
AFTER UPDATE ON auctions
FOR EACH ROW
EXECUTE FUNCTION process_auction_status_change();

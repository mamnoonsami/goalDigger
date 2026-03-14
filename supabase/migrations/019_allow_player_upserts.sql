-- Allow players to update their own signup row (required for the upsert behavior in joinMatch)
-- The upsert command requires both INSERT and UPDATE permissions.
-- We use a WITH CHECK clause to ensure they don't change their team assignment.

CREATE POLICY "signups_update_self" ON public.match_signups
  FOR UPDATE
  USING (auth.uid() = player_id)
  WITH CHECK (
    -- Allow the update only if they aren't trying to change their team
    -- (This prevents players from assigning themselves to Team 1 or 2 via direct API calls)
    team IS NOT DISTINCT FROM (SELECT team FROM public.match_signups ms WHERE ms.match_id = match_id AND ms.player_id = auth.uid())
  );

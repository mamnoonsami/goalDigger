-- Add DELETE policy for matches table so admins can delete matches
DROP POLICY IF EXISTS "matches_delete_admin" ON public.matches;
CREATE POLICY "matches_delete_admin" ON public.matches FOR DELETE
  USING (is_admin());

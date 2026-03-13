-- =====================================================
-- Goal Digger — Admin Match Signups Policy Fix (Pure RLS)
-- Uses the modern is_admin() helper defined in 004
-- =====================================================

-- Drop the broken policies from migration 017
DROP POLICY IF EXISTS "signups_insert_admin" ON public.match_signups;
DROP POLICY IF EXISTS "signups_delete_admin" ON public.match_signups;

-- Admin can Insert (Add players) based on modern is_admin flag
CREATE POLICY "signups_insert_admin" ON public.match_signups FOR INSERT
  WITH CHECK (is_admin());

-- Admin can Delete (Remove players) based on modern is_admin flag
CREATE POLICY "signups_delete_admin" ON public.match_signups FOR DELETE
  USING (is_admin());

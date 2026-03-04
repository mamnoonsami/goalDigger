-- Migration to switch RLS policies from 'role' enum to boolean flags (is_admin, is_manager)
-- This allows a user to have multiple capabilities (e.g. player AND manager).

-- 1. Create helper functions for clean policy definitions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT is_admin FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
  SELECT is_manager FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Drop the old role-based helper if no longer needed (optional, keeping for safety but not using)
-- DROP FUNCTION IF EXISTS auth_role(); 

-- 3. Update Policies

-- PROFILES
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin());

-- MATCHES
DROP POLICY IF EXISTS "matches_insert" ON public.matches;
CREATE POLICY "matches_insert" ON public.matches FOR INSERT
  WITH CHECK (is_admin() OR is_manager());

DROP POLICY IF EXISTS "matches_update" ON public.matches;
CREATE POLICY "matches_update" ON public.matches FOR UPDATE
  USING (is_admin() OR is_manager());

-- MATCH SIGNUPS
DROP POLICY IF EXISTS "signups_update_admin" ON public.match_signups;
CREATE POLICY "signups_update_admin" ON public.match_signups FOR UPDATE
  USING (is_admin());

-- MATCH STATS
DROP POLICY IF EXISTS "stats_write_admin" ON public.match_stats;
CREATE POLICY "stats_write_admin" ON public.match_stats FOR ALL
  USING (is_admin());

-- TOURNAMENTS
DROP POLICY IF EXISTS "tournaments_write" ON public.tournaments;
CREATE POLICY "tournaments_write" ON public.tournaments FOR ALL
  USING (is_admin() OR is_manager());

-- TOURNAMENT PLAYERS
DROP POLICY IF EXISTS "tp_write_admin" ON public.tournament_players;
CREATE POLICY "tp_write_admin" ON public.tournament_players FOR ALL
  USING (is_admin());

-- BIDS
DROP POLICY IF EXISTS "bids_insert_manager" ON public.bids;
CREATE POLICY "bids_insert_manager" ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = manager_id AND is_manager());

DROP POLICY IF EXISTS "bids_update_admin" ON public.bids;
CREATE POLICY "bids_update_admin" ON public.bids FOR UPDATE
  USING (is_admin());

-- =====================================================
-- Goal Digger — Global Tournament Visibility & RLS Relaxations
-- =====================================================

-- 1. Allow tenant_id to be NULL for all tournament-related tables
-- This ensures unassigned players/users (no group) can join tournaments and teams.
ALTER TABLE public.tournaments ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.tournament_players ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.tournament_teams ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.tournament_matches ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.tournament_match_stats ALTER COLUMN tenant_id DROP NOT NULL;


-- 2. Profiles: Allow global select so players from different groups are visible to each other
DROP POLICY IF EXISTS "profiles_select_isolation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

-- Fix profiles_update policy to allow unassigned users (tenant_id IS NULL) to update their own profile
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
    (auth.uid() = id)
    OR (public.is_admin() AND tenant_id = public.current_user_tenant_id())
);


-- 3. Tenants: Allow global select so users/signups can query group details
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_all" ON public.tenants;
CREATE POLICY "tenants_select_all" ON public.tenants FOR SELECT USING (true);


-- 4. Tournaments: Allow global select
DROP POLICY IF EXISTS "tournaments_select" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments;
CREATE POLICY "tournaments_select_all" ON public.tournaments FOR SELECT USING (true);


-- 5. Tournament Teams: Allow global select
DROP POLICY IF EXISTS "tt_select" ON public.tournament_teams;
DROP POLICY IF EXISTS "tt_select_all" ON public.tournament_teams;
CREATE POLICY "tt_select_all" ON public.tournament_teams FOR SELECT USING (true);


-- 6. Tournament Players: Allow global select
DROP POLICY IF EXISTS "tp_select" ON public.tournament_players;
DROP POLICY IF EXISTS "tp_select_all" ON public.tournament_players;
CREATE POLICY "tp_select_all" ON public.tournament_players FOR SELECT USING (true);


-- 7. Tournament Matches: Allow global select
DROP POLICY IF EXISTS "tm_select" ON public.tournament_matches;
DROP POLICY IF EXISTS "tm_select_all" ON public.tournament_matches;
CREATE POLICY "tm_select_all" ON public.tournament_matches FOR SELECT USING (true);


-- 8. Tournament Match Stats: Allow global select
DROP POLICY IF EXISTS "tms_select" ON public.tournament_match_stats;
DROP POLICY IF EXISTS "tms_select_all" ON public.tournament_match_stats;
CREATE POLICY "tms_select_all" ON public.tournament_match_stats FOR SELECT USING (true);

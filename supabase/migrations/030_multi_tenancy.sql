-- =====================================================
-- Goal Digger — Multi-Tenancy (Group Isolation) Migration
-- =====================================================

-- 1. Create tenants table (Base table, has no dependencies)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create the default tenant 'OG'
INSERT INTO public.tenants (id, name) 
VALUES ('d0000000-0000-0000-0000-000000000000', 'OG')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Setup profiles table (Guaranteed to exist, core table)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
UPDATE public.profiles SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Helper function for resolving the current authenticated user's tenant_id
-- Defined after public.profiles has its tenant_id column.
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Set default on profiles (new users will be assigned this default by trigger, but we set it anyway)
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET DEFAULT 'd0000000-0000-0000-0000-000000000000';

-- === PROFILES RLS ===
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_isolation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_select_isolation" ON public.profiles FOR SELECT USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
    (auth.uid() = id AND tenant_id = public.current_user_tenant_id())
    OR (public.is_admin() AND tenant_id = public.current_user_tenant_id())
);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (
    (public.is_admin() AND tenant_id = public.current_user_tenant_id())
);

-- 5. Rewrite the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  
  IF v_tenant_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_id) THEN
    RAISE EXCEPTION 'A valid Group ID is required to register.';
  END IF;

  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    avatar_url, 
    tenant_id, 
    role, 
    is_viewer, 
    is_admin, 
    is_king, 
    is_manager, 
    is_player
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Player'),
    NEW.raw_user_meta_data->>'avatar_url',
    v_tenant_id,
    'viewer'::public.user_roles,
    true,
    false,
    false,
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 6. Setup all other tables conditionally using PL/pgSQL
-- This prevents the migration from crashing if certain tables (like bids, auctions, tournaments, etc.) do not exist yet.

-- === MATCHES ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matches') THEN
        ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.matches SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.matches ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.matches ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "matches_select_all" ON public.matches;
        DROP POLICY IF EXISTS "matches_select" ON public.matches;
        DROP POLICY IF EXISTS "matches_insert" ON public.matches;
        DROP POLICY IF EXISTS "matches_update" ON public.matches;
        DROP POLICY IF EXISTS "matches_write" ON public.matches;
        
        CREATE POLICY "matches_select" ON public.matches FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "matches_write" ON public.matches FOR ALL USING (tenant_id = public.current_user_tenant_id() AND (public.is_admin() OR public.is_manager()));
    END IF;
END $$;

-- === MATCH SIGNUPS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_signups') THEN
        ALTER TABLE public.match_signups ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.match_signups SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.match_signups ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.match_signups ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.match_signups ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "signups_select_all" ON public.match_signups;
        DROP POLICY IF EXISTS "signups_select" ON public.match_signups;
        DROP POLICY IF EXISTS "signups_insert_self" ON public.match_signups;
        DROP POLICY IF EXISTS "signups_delete_self" ON public.match_signups;
        DROP POLICY IF EXISTS "signups_update_admin" ON public.match_signups;
        DROP POLICY IF EXISTS "signups_write_self" ON public.match_signups;
        DROP POLICY IF EXISTS "signups_write_admin" ON public.match_signups;
        
        CREATE POLICY "signups_select" ON public.match_signups FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "signups_write_self" ON public.match_signups FOR ALL USING (tenant_id = public.current_user_tenant_id() AND auth.uid() = player_id);
        CREATE POLICY "signups_write_admin" ON public.match_signups FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === MATCH STATS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_stats') THEN
        ALTER TABLE public.match_stats ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.match_stats SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.match_stats ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.match_stats ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "stats_select_all" ON public.match_stats;
        DROP POLICY IF EXISTS "stats_select" ON public.match_stats;
        DROP POLICY IF EXISTS "stats_write_admin" ON public.match_stats;
        DROP POLICY IF EXISTS "stats_write" ON public.match_stats;
        
        CREATE POLICY "stats_select" ON public.match_stats FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "stats_write" ON public.match_stats FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === TOURNAMENTS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tournaments') THEN
        ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.tournaments SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.tournaments ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.tournaments ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments;
        DROP POLICY IF EXISTS "tournaments_select" ON public.tournaments;
        DROP POLICY IF EXISTS "tournaments_write" ON public.tournaments;
        
        CREATE POLICY "tournaments_select" ON public.tournaments FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "tournaments_write" ON public.tournaments FOR ALL USING (tenant_id = public.current_user_tenant_id() AND (public.is_admin() OR public.is_manager()));
    END IF;
END $$;

-- === TOURNAMENT PLAYERS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tournament_players') THEN
        ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.tournament_players SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.tournament_players ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.tournament_players ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tp_select_all" ON public.tournament_players;
        DROP POLICY IF EXISTS "tp_select" ON public.tournament_players;
        DROP POLICY IF EXISTS "tp_write_admin" ON public.tournament_players;
        DROP POLICY IF EXISTS "tp_write" ON public.tournament_players;
        
        CREATE POLICY "tp_select" ON public.tournament_players FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "tp_write" ON public.tournament_players FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === BIDS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bids') THEN
        ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.bids SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.bids ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.bids ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "bids_select_all" ON public.bids;
        DROP POLICY IF EXISTS "bids_select" ON public.bids;
        DROP POLICY IF EXISTS "bids_insert_manager" ON public.bids;
        DROP POLICY IF EXISTS "bids_insert" ON public.bids;
        DROP POLICY IF EXISTS "bids_update_admin" ON public.bids;
        DROP POLICY IF EXISTS "bids_admin" ON public.bids;
        
        CREATE POLICY "bids_select" ON public.bids FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "bids_insert" ON public.bids FOR INSERT WITH CHECK (tenant_id = public.current_user_tenant_id() AND auth.uid() = manager_id AND public.is_manager());
        CREATE POLICY "bids_admin" ON public.bids FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === AUCTIONS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auctions') THEN
        ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.auctions SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.auctions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.auctions ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "auctions_select_all" ON public.auctions;
        DROP POLICY IF EXISTS "auctions_select" ON public.auctions;
        DROP POLICY IF EXISTS "auctions_insert_admin" ON public.auctions;
        DROP POLICY IF EXISTS "auctions_update_admin" ON public.auctions;
        DROP POLICY IF EXISTS "auctions_delete_admin" ON public.auctions;
        DROP POLICY IF EXISTS "auctions_write" ON public.auctions;
        
        CREATE POLICY "auctions_select" ON public.auctions FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "auctions_write" ON public.auctions FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === AUCTION PLAYERS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auction_players') THEN
        ALTER TABLE public.auction_players ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.auction_players SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.auction_players ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.auction_players ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.auction_players ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "ap_select_all" ON public.auction_players;
        DROP POLICY IF EXISTS "ap_select" ON public.auction_players;
        DROP POLICY IF EXISTS "ap_write_admin" ON public.auction_players;
        DROP POLICY IF EXISTS "ap_update_admin" ON public.auction_players;
        DROP POLICY IF EXISTS "ap_delete_admin" ON public.auction_players;
        DROP POLICY IF EXISTS "ap_write" ON public.auction_players;
        
        CREATE POLICY "ap_select" ON public.auction_players FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "ap_write" ON public.auction_players FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === AUCTION BIDS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auction_bids') THEN
        ALTER TABLE public.auction_bids ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.auction_bids SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.auction_bids ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.auction_bids ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "ab_select_all" ON public.auction_bids;
        DROP POLICY IF EXISTS "ab_select" ON public.auction_bids;
        DROP POLICY IF EXISTS "ab_insert_manager" ON public.auction_bids;
        DROP POLICY IF EXISTS "ab_insert" ON public.auction_bids;
        DROP POLICY IF EXISTS "ab_update_admin" ON public.auction_bids;
        DROP POLICY IF EXISTS "ab_admin" ON public.auction_bids;
        
        CREATE POLICY "ab_select" ON public.auction_bids FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "ab_insert" ON public.auction_bids FOR INSERT WITH CHECK (tenant_id = public.current_user_tenant_id() AND auth.uid() = manager_id AND public.is_manager());
        CREATE POLICY "ab_admin" ON public.auction_bids FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === AUCTION MANAGERS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auction_managers') THEN
        ALTER TABLE public.auction_managers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.auction_managers SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.auction_managers ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.auction_managers ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.auction_managers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Anyone can view auction managers" ON public.auction_managers;
        DROP POLICY IF EXISTS "Admin can manage auction managers" ON public.auction_managers;
        DROP POLICY IF EXISTS "am_select" ON public.auction_managers;
        DROP POLICY IF EXISTS "am_write" ON public.auction_managers;
        
        CREATE POLICY "am_select" ON public.auction_managers FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "am_write" ON public.auction_managers FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === TOURNAMENT TEAMS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tournament_teams') THEN
        ALTER TABLE public.tournament_teams ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.tournament_teams SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.tournament_teams ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.tournament_teams ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tt_select_all" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_select" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_insert_admin" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_update_admin" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_delete_admin" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_insert_manager" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_update_manager_own" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_write_admin" ON public.tournament_teams;
        DROP POLICY IF EXISTS "tt_write_manager" ON public.tournament_teams;
        
        CREATE POLICY "tt_select" ON public.tournament_teams FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "tt_write_admin" ON public.tournament_teams FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
        CREATE POLICY "tt_write_manager" ON public.tournament_teams FOR ALL USING (tenant_id = public.current_user_tenant_id() AND manager_id = auth.uid() AND public.is_manager());
    END IF;
END $$;

-- === PLAYER RATINGS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_ratings') THEN
        ALTER TABLE public.player_ratings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.player_ratings SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.player_ratings ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.player_ratings ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "ratings_select_all" ON public.player_ratings;
        DROP POLICY IF EXISTS "ratings_select" ON public.player_ratings;
        DROP POLICY IF EXISTS "ratings_insert_self" ON public.player_ratings;
        DROP POLICY IF EXISTS "ratings_update_self" ON public.player_ratings;
        DROP POLICY IF EXISTS "ratings_delete_self" ON public.player_ratings;
        DROP POLICY IF EXISTS "ratings_write_self" ON public.player_ratings;
        
        CREATE POLICY "ratings_select" ON public.player_ratings FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "ratings_write_self" ON public.player_ratings FOR ALL USING (tenant_id = public.current_user_tenant_id() AND auth.uid() = rater_id);
    END IF;
END $$;

-- === GLOBAL MESSAGES (CHAT) ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'global_messages') THEN
        ALTER TABLE public.global_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.global_messages SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.global_messages ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.global_messages ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.global_messages;
        DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.global_messages;
        DROP POLICY IF EXISTS "chat_select" ON public.global_messages;
        DROP POLICY IF EXISTS "chat_insert" ON public.global_messages;
        
        CREATE POLICY "chat_select" ON public.global_messages FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "chat_insert" ON public.global_messages FOR INSERT WITH CHECK (tenant_id = public.current_user_tenant_id() AND auth.uid() = user_id);
    END IF;
END $$;

-- === TOURNAMENT MATCHES ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tournament_matches') THEN
        ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.tournament_matches SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.tournament_matches ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.tournament_matches ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tournament_matches_select" ON public.tournament_matches;
        DROP POLICY IF EXISTS "tournament_matches_insert_admin" ON public.tournament_matches;
        DROP POLICY IF EXISTS "tournament_matches_update_admin" ON public.tournament_matches;
        DROP POLICY IF EXISTS "tournament_matches_delete_admin" ON public.tournament_matches;
        DROP POLICY IF EXISTS "tm_select" ON public.tournament_matches;
        DROP POLICY IF EXISTS "tm_write" ON public.tournament_matches;
        
        CREATE POLICY "tm_select" ON public.tournament_matches FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "tm_write" ON public.tournament_matches FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === TOURNAMENT MATCH STATS ===
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tournament_match_stats') THEN
        ALTER TABLE public.tournament_match_stats ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
        UPDATE public.tournament_match_stats SET tenant_id = 'd0000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
        ALTER TABLE public.tournament_match_stats ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.tournament_match_stats ALTER COLUMN tenant_id SET DEFAULT public.current_user_tenant_id();
        
        ALTER TABLE public.tournament_match_stats ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tms_select" ON public.tournament_match_stats;
        DROP POLICY IF EXISTS "tms_insert_admin" ON public.tournament_match_stats;
        DROP POLICY IF EXISTS "tms_update_admin" ON public.tournament_match_stats;
        DROP POLICY IF EXISTS "tms_delete_admin" ON public.tournament_match_stats;
        DROP POLICY IF EXISTS "tms_write" ON public.tournament_match_stats;
        
        CREATE POLICY "tms_select" ON public.tournament_match_stats FOR SELECT USING (tenant_id = public.current_user_tenant_id());
        CREATE POLICY "tms_write" ON public.tournament_match_stats FOR ALL USING (tenant_id = public.current_user_tenant_id() AND public.is_admin());
    END IF;
END $$;

-- === TENANTS RLS ===
-- Defined at the very end to guarantee profiles.tenant_id exists.
DROP POLICY IF EXISTS "tenants_update_admin" ON public.tenants;
CREATE POLICY "tenants_update_admin" ON public.tenants 
    FOR UPDATE 
    USING (
        id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT is_admin OR is_king FROM public.profiles WHERE id = auth.uid())
    );

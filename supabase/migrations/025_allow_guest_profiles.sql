-- =====================================================
-- Goal Digger — Allow Guest Profiles
-- Enables adding external players (guests) who don't
-- have an auth account, for inter-province tournaments.
-- =====================================================

-- ─────────────────────────────────────────────
-- 1. Drop the FK from profiles.id → auth.users(id)
--    so we can insert profiles without an auth row.
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also drop the constraint created by REFERENCES auth.users(id)
-- (Supabase may name it differently)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

ALTER TABLE public.profiles
  ADD PRIMARY KEY (id);

-- ─────────────────────────────────────────────
-- 2. Add default UUID generation for new profiles
--    (auth-created profiles still get auth.users.id,
--     but guest profiles need auto-generated IDs)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ─────────────────────────────────────────────
-- 3. Add is_guest flag
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────
-- 4. Allow admins to insert profiles (for guests)
--    The existing policy only allows auth.uid() = id
-- ─────────────────────────────────────────────
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (is_admin());

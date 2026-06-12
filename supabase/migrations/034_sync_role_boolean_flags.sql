-- =====================================================
-- Goal Digger — Sync Role Enum with Boolean Privilege Flags
-- =====================================================

-- Ensure that any users with the 'admin' role have is_admin set to true
UPDATE public.profiles 
SET is_admin = true 
WHERE role = 'admin';

-- Ensure that any users with the 'manager' role have is_manager set to true
UPDATE public.profiles 
SET is_manager = true 
WHERE role = 'manager';

-- Ensure that any users with the 'player' role have is_player set to true
UPDATE public.profiles 
SET is_player = true 
WHERE role = 'player';

-- Ensure that any users with the 'viewer' role have is_viewer set to true
UPDATE public.profiles 
SET is_viewer = true 
WHERE role = 'viewer';

-- =====================================================
-- Goal Digger — Default Player Role for New Users
-- =====================================================

-- Update the handle_new_user trigger to set both is_viewer and is_player to true,
-- and set the primary role to 'player'.
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
    'player'::public.user_roles,
    true,   -- is_viewer
    false,  -- is_admin
    false,  -- is_king
    false,  -- is_manager
    true    -- is_player
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


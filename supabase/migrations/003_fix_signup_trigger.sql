-- Fix for 500 Internal Server Error on Signup
-- Replaces the handle_new_user trigger function with a more robust version
-- capable of handling missing metadata and ensuring correct search_path.

-- 1. Drop existing trigger and function to allow clean recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recreate function with explicit search_path and error handling best practices
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
  VALUES (
    NEW.id,
    -- Use COALESCE to ensure non-null values for required fields
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Player'),
    NEW.raw_user_meta_data->>'avatar_url',
    'viewer'::public.user_roles
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Reattach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

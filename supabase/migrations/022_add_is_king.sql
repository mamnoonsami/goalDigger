-- Add is_king column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_king BOOLEAN DEFAULT FALSE;

-- Update is_admin() function so it returns true if the user is_admin OR is_king
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT is_admin OR is_king FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Function to check specifically for king role, in case future policies require it
CREATE OR REPLACE FUNCTION public.is_king()
RETURNS boolean AS $$
  SELECT is_king FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

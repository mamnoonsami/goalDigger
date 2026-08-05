-- Add is_active column to profiles table (default true)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Ensure existing rows are set to active
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- Allow users to be unassigned (no group)
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;

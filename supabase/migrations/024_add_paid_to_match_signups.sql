-- Add 'paid' boolean column to track payment status for match signups
ALTER TABLE public.match_signups
ADD COLUMN paid BOOLEAN DEFAULT false NOT NULL;

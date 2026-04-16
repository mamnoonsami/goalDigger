-- Migration: Add peer_rating_score to profiles
-- Description: Adds a new column to store the calculated peer rating score.

ALTER TABLE public.profiles
ADD COLUMN peer_rating_score NUMERIC(5,2) DEFAULT NULL;

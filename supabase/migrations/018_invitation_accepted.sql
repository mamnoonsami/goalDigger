-- Add invitation_accepted column to match_signups
-- Defaults to true so existing signups and normal "Join" button work unchanged
ALTER TABLE match_signups
  ADD COLUMN invitation_accepted boolean NOT NULL DEFAULT true;

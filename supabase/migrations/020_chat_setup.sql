-- ============================================================
-- Goal Digger — Global Chat Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- 1. Create the global messages table
CREATE TABLE IF NOT EXISTS public.global_messages (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message     TEXT        NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 1000),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index to speed up ordered reads
CREATE INDEX IF NOT EXISTS global_messages_created_at_idx ON public.global_messages (created_at DESC);

-- ============================================================
-- 2. Row Level Security
-- ============================================================
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

-- Any logged-in user can read all messages
CREATE POLICY "Authenticated users can read messages"
    ON public.global_messages
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can only insert their OWN messages
CREATE POLICY "Authenticated users can send messages"
    ON public.global_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. Add last_read_chat_at to profiles for unread tracking
-- ============================================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_read_chat_at TIMESTAMPTZ DEFAULT NOW();

-- NOTE: The existing "profiles_update_self_or_admin" policy from migration 004 already
-- allows users to update their own profile row, so no extra policy is needed here.

-- ============================================================
-- 4. Enable Supabase Realtime for global_messages
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;

-- ============================================================
-- 5. Auto-delete messages older than 7 days (pg_cron)
-- NOTE: Make sure pg_cron extension is enabled in your
--       Supabase project → Database → Extensions
-- ============================================================
SELECT cron.schedule(
    'delete-old-chat-messages',
    '0 3 * * *',  -- Every day at 03:00 UTC
    $$ DELETE FROM public.global_messages WHERE created_at < NOW() - INTERVAL '7 days'; $$
);

-- ============================================================
-- 6. Add reply_to_id for threaded replies
-- Run this block separately if you already ran sections 1-5
-- ============================================================
ALTER TABLE public.global_messages
    ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.global_messages(id) ON DELETE SET NULL;

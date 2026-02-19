import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase browser client — use this in hooks, components, and Zustand stores.
 * Safe to call multiple times; @supabase/ssr handles singleton semantics.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

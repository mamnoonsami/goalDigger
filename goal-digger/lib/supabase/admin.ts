import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client — uses the service_role key to bypass RLS.
 * Use ONLY in server actions/route handlers for privileged operations
 * like creating guest profiles.
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase server client — use this in Server Components and Route Handlers.
 * Must be called inside an async function since cookies() is async in Next.js 15+.
 */
export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (toSet) =>
                    toSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    ),
            },
        }
    )
}

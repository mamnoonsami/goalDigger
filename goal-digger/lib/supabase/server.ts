import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type SetAllCookieEntry = { name: string; value: string; options?: Record<string, unknown> }

/**
 * Supabase server client — use in Server Components and Route Handlers only.
 * Lives here (inside the Next.js app) because it depends on `next/headers`.
 */
export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (toSet: SetAllCookieEntry[]) =>
                    toSet.forEach(({ name, value, options }) =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        cookieStore.set(name, value, options as any)
                    ),
            },
        }
    )
}

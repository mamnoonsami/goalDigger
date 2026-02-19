import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type SetAllCookieEntry = { name: string; value: string; options?: Record<string, unknown> }

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (toSet: SetAllCookieEntry[]) => {
                    toSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    toSet.forEach(({ name, value, options }) =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        supabaseResponse.cookies.set(name, value, options as any)
                    )
                },
            },
        }
    )

    // Refresh the session — must be called before any redirect checks
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
    const isAppRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/matches') ||
        pathname.startsWith('/players') ||
        pathname.startsWith('/tournaments') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/auction')

    // Redirect unauthenticated users away from protected routes
    if (!user && isAppRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

import { createClient } from '../../../lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Supabase email confirmation callback handler.
 * 
 * Supports two flows:
 * 1. PKCE flow — Supabase redirects here with a `code` query param
 * 2. Magic link flow — Supabase redirects here with `token_hash` + `type` params
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'signup' | 'email' | null
    const next = '/login?confirmed=true'

    const supabase = await createClient()

    // PKCE flow — exchange auth code for session
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(new URL(next, origin))
        }
    }

    // Magic link / OTP flow — verify token hash
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
            return NextResponse.redirect(new URL(next, origin))
        }
    }

    // If verification fails, redirect to login with an error
    return NextResponse.redirect(new URL('/login?confirmed=error', origin))
}

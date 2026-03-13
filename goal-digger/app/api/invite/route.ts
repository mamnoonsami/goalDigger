import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const secret = process.env.SUPABASE_JWT_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!token || !secret) {
        return NextResponse.redirect(`${baseUrl}/?error=Invalid+invitation+link`)
    }

    try {
        // 1. Verify and decode the JWT
        const decoded = jwt.verify(token, secret) as { matchId: string, playerId: string }
        const { matchId, playerId } = decoded

        // 2. Add player to match_signups safely using the Service Role Key
        // Service Role Key bypasses RLS, acting exactly like our Admin RPC bypassing
        const supabase = await createClient() // we use standard setup, but let's override the auth header
        const supabaseAdmin = await createClient()

        // Important: Next.js app router doesn't easily let you pass an entirely different client instance key safely
        // if they are bound to cookies unless you initialize a pure client. 
        // We will create an admin-level client explicitly for this insert.
        
        const { createClient: createPureClient } = await import('@supabase/supabase-js')
        const adminClient = createPureClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await adminClient
            .from('match_signups')
            .insert({ match_id: matchId, player_id: playerId })

        // 3. Ignore duplicate errors (they already joined)
        if (error && error.code !== '23505') {
            console.error('Failed to insert match signup via magic link:', error)
            return NextResponse.redirect(`${baseUrl}/?error=Could+not+join+match`)
        }

        // 4. Redirect to public success page!
        return NextResponse.redirect(`${baseUrl}/invite/success?match=${matchId}`)

    } catch (err) {
        console.error('Magic link verification failed:', err)
        return NextResponse.redirect(`${baseUrl}/?error=Invitation+link+expired+or+invalid`)
    }
}

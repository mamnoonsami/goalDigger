import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const action = searchParams.get('action') || 'accept'

    const secret = process.env.SUPABASE_JWT_SECRET
    
    // Support Vercel deployments automatically
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')

    if (!token || !secret) {
        return NextResponse.redirect(`${baseUrl}/?error=Invalid+invitation+link`)
    }

    try {
        // 1. Verify and decode the JWT
        const decoded = jwt.verify(token, secret) as { matchId: string, playerId: string }
        const { matchId, playerId } = decoded

        // 2. Create admin Supabase client (bypasses RLS)
        const { createClient: createPureClient } = await import('@supabase/supabase-js')
        const adminClient = createPureClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const accepted = action !== 'decline'

        // 3. Upsert into match_signups
        // If the player already has a row (e.g. clicked accept then decline or vice versa),
        // update it. Otherwise, insert a new row.
        const { error } = await adminClient
            .from('match_signups')
            .upsert(
                { match_id: matchId, player_id: playerId, invitation_accepted: accepted },
                { onConflict: 'match_id,player_id' }
            )

        if (error) {
            console.error('Failed to upsert match signup via magic link:', error)
            return NextResponse.redirect(`${baseUrl}/?error=Could+not+process+invitation`)
        }

        // 4. Redirect to the appropriate page
        if (accepted) {
            return NextResponse.redirect(`${baseUrl}/invite/success?match=${matchId}`)
        } else {
            return NextResponse.redirect(`${baseUrl}/invite/declined?match=${matchId}`)
        }

    } catch (err) {
        console.error('Magic link verification failed:', err)
        return NextResponse.redirect(`${baseUrl}/?error=Invitation+link+expired+or+invalid`)
    }
}

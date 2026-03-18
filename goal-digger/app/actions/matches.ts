'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMatch(data: { location?: string; scheduled_at: string; title: string; max_players: number; notes?: string }) {
    const supabase = await createClient()

    const { data: match, error } = await supabase
        .from('matches')
        .insert({
            ...data,
            status: 'open',
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/matches')
    return match
}

export async function updateMatch(id: string, data: { location?: string; scheduled_at?: string; title?: string; status?: string; max_players?: number; notes?: string }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('matches')
        .update(data)
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/matches')
    revalidatePath(`/matches/${id}`)
}

/** Player joins an open match */
export async function joinMatch(matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('match_signups')
        .upsert(
            { match_id: matchId, player_id: user.id, invitation_accepted: true },
            { onConflict: 'match_id,player_id' }
        )

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
}

/** Player leaves a match */
export async function leaveMatch(matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('match_signups')
        .delete()
        .eq('match_id', matchId)
        .eq('player_id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
}

/** Admin: batch-save all team assignments (replaces per-move writes) */
export async function saveTeamAssignments(
    matchId: string,
    assignments: { playerId: string; team: 1 | 2 }[]
) {
    const supabase = await createClient()

    // Write all team assignments in parallel
    const updates = assignments.map(({ playerId, team }) =>
        supabase
            .from('match_signups')
            .update({ team })
            .eq('match_id', matchId)
            .eq('player_id', playerId)
    )
    const results = await Promise.all(updates)

    const failed = results.find((r) => r.error)
    if (failed?.error) throw new Error(failed.error.message)

    // Set match status to balanced
    await supabase.from('matches').update({ status: 'balanced' }).eq('id', matchId)

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin: reset all team assignments and set match back to open */
export async function resetTeams(matchId: string) {
    const supabase = await createClient()

    // Clear all team assignments
    const { error: signupError } = await supabase
        .from('match_signups')
        .update({ team: null })
        .eq('match_id', matchId)

    if (signupError) throw new Error(signupError.message)

    // Set match status back to open
    const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'open' })
        .eq('id', matchId)

    if (matchError) throw new Error(matchError.message)

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin: delete a match completely */
export async function deleteMatch(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin: Bulk add/remove players to/from match */
export async function updateMatchPlayers(matchId: string, addIds: string[], removeIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not authorized')

    // Remove players
    if (removeIds.length > 0) {
        const { error: removeError } = await supabase
            .from('match_signups')
            .delete()
            .eq('match_id', matchId)
            .in('player_id', removeIds)

        if (removeError) throw new Error(removeError.message)
    }

    // Add players
    if (addIds.length > 0) {
        const insertData = addIds.map(id => ({ match_id: matchId, player_id: id, invitation_accepted: true }))
        const { error: addError } = await supabase
            .from('match_signups')
            .upsert(insertData, { onConflict: 'match_id,player_id' })

        // Ignoring duplicate errors if any
        if (addError && addError.code !== '23505') throw new Error(addError.message)
    }

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin: Send an email invitation directly to a player */
export async function sendMatchInvitation(matchId: string, playerId: string, localizedTime?: string) {
    const supabase = await createClient()

    // 1. Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not authorized')

    // 2. Fetch match details for the email content
    const { data: match } = await supabase.from('matches').select('title, scheduled_at, location').eq('id', matchId).single()
    if (!match) throw new Error('Match not found')

    // 3. Fetch the target player's auth profile (Service Role needed to read email)
    const { createClient: createPureClient } = await import('@supabase/supabase-js')
    const adminClient = createPureClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // We can query auth.users by linking through the admin API
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(playerId)
    if (userError || !userData?.user?.email) {
        throw new Error('Could not find email for this player')
    }
    const targetEmail = userData.user.email

    // 4. Generate the stateless JWT
    const jwt = await import('jsonwebtoken')
    const secret = process.env.SUPABASE_JWT_SECRET
    if (!secret) throw new Error('JWT Secret is not configured')

    const token = jwt.sign({ matchId, playerId }, secret, {
        expiresIn: '5d', // Set to exactly 5 days per user request
    })

    // 5. Construct the magic links
    // On Vercel, use their auto-generated production URL or deployment URL if APP_URL isn't set
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')

    const acceptLink = `${baseUrl}/api/invite?token=${token}&action=accept`
    const declineLink = `${baseUrl}/api/invite?token=${token}&action=decline`

    // 6. Send the email using Nodemailer and Gmail App Password
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    })

    const matchDate = localizedTime || (match.scheduled_at
        ? new Date(match.scheduled_at).toLocaleString()
        : 'TBD')

    await transporter.sendMail({
        from: `"Saturday Soccer Match" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `Invite: ${match.title}! ⚽`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #166534; margin: 0; font-size: 24px; font-weight: 800;">You're Needed!</h1>
                    <p style="color: #475569; margin-top: 8px;">An admin has invited you to join a match.</p>
                </div>

                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Match Details</h2>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px; letter-spacing: 0.05em;">⚽ Match</span>
                        <strong style="color: #0f172a; font-size: 16px;">${match.title}</strong>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px; letter-spacing: 0.05em;">📅 Date & Time</span>
                        <span style="color: #0f172a; font-size: 16px;">${matchDate}</span>
                    </div>

                    <div style="margin-bottom: 0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px; letter-spacing: 0.05em;">📍 Location</span>
                        <span style="color: #0f172a; font-size: 16px;">${match.location || 'TBD'}</span>
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="${acceptLink}" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 8px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);">
                        Accept & Join
                    </a>
                    <a href="${declineLink}" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">
                        Decline
                    </a>
                     <p style="color: #475569; font-size: 14px; margin-bottom: 20px;"><b>Login not required.</b></p>
                </div>

                <footer style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">This invitation link expires in 5 days.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">You can also manage your status by logging into your account.</p>
                </footer>
            </div>
        `
    })
}

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
        .insert({ match_id: matchId, player_id: user.id })

    if (error) {
        if (error.code === '23505') throw new Error('You have already joined this match')
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
        const insertData = addIds.map(id => ({ match_id: matchId, player_id: id }))
        const { error: addError } = await supabase
            .from('match_signups')
            .insert(insertData)
        
        // Ignoring duplicate errors if any
        if (addError && addError.code !== '23505') throw new Error(addError.message)
    }

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin: Send an email invitation directly to a player */
export async function sendMatchInvitation(matchId: string, playerId: string) {
    const supabase = await createClient()

    // 1. Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not authorized')

    // 2. Fetch match details for the email content
    const { data: match } = await supabase.from('matches').select('title, scheduled_at').eq('id', matchId).single()
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

    // 5. Construct the magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/api/invite?token=${token}`

    // 6. Send the email using Nodemailer and Gmail App Password
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER, // Your existing gmail
            pass: process.env.SMTP_PASSWORD, // Your existing app password
        },
    })

    const matchDate = match.scheduled_at 
        ? new Date(match.scheduled_at).toLocaleString() 
        : 'TBD'

    await transporter.sendMail({
        from: `"Goal Digger" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `You're invited to play: ${match.title}! ⚽`,
        html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; p-4;">
                <h2 style="color: #2F8A4B;">You've been invited!</h2>
                <p>An admin has invited you to join the upcoming match <strong>${match.title}</strong> scheduled for ${matchDate}.</p>
                <p>Click the button below to accept the invitation safely. You do not need to log in.</p>
                <div style="margin: 30px 0;">
                    <a href="${magicLink}" style="background-color: #2F8A4B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Join Match
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will automatically expire in 5 days.</p>
            </div>
        `,
    })
}

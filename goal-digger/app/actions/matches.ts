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

/** Player clicks "Can't Make It" from the UI */
export async function declineMatch(matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('match_signups')
        .upsert(
            { match_id: matchId, player_id: user.id, invitation_accepted: false },
            { onConflict: 'match_id,player_id' }
        )

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

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

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

    // ignoring duplicate errors if any
        if (addError && addError.code !== '23505') throw new Error(addError.message)
    }

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin: Bulk add/remove players to/from declined list */
export async function updateDeclinedPlayers(matchId: string, addIds: string[], removeIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    // Remove players from declined list (back to neutral/uninvited state)
    if (removeIds.length > 0) {
        const { error: removeError } = await supabase
            .from('match_signups')
            .delete()
            .eq('match_id', matchId)
            .in('player_id', removeIds)

        if (removeError) throw new Error(removeError.message)
    }

    // Add players to declined list (force false)
    if (addIds.length > 0) {
        const insertData = addIds.map(id => ({ match_id: matchId, player_id: id, invitation_accepted: false }))
        const { error: addError } = await supabase
            .from('match_signups')
            .upsert(insertData, { onConflict: 'match_id,player_id' })

        if (addError && addError.code !== '23505') throw new Error(addError.message)
    }

    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/dashboard')
    revalidatePath('/matches')
}

/** Admin/King: Toggle paid status for a single player */
export async function togglePaidStatus(matchId: string, playerId: string, isPaid: boolean) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    const { error } = await supabase
        .from('match_signups')
        .update({ paid: isPaid })
        .eq('match_id', matchId)
        .eq('player_id', playerId)

    if (error) throw new Error(error.message)

    revalidatePath(`/matches/${matchId}`)
}

function formatDateTime12h(isoOrDate?: string | Date | null): string {
    if (!isoOrDate) return 'TBD'
    const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
    if (isNaN(date.getTime())) return 'TBD'
    return date.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

/** Fetch list of player IDs that have email addresses in auth.users */
export async function getPlayerIdsWithEmails(playerIds?: string[]): Promise<string[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { createClient: createPureClient } = await import('@supabase/supabase-js')
    const adminClient = createPureClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: usersData, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    if (error || !usersData?.users) return []

    const validEmailSet = new Set(
        usersData.users
            .filter(u => u.email && u.email.trim() !== '')
            .map(u => u.id)
    )

    if (playerIds && playerIds.length > 0) {
        return playerIds.filter(id => validEmailSet.has(id))
    }

    return Array.from(validEmailSet)
}

/** Admin: Send an email invitation directly to a player */
export async function sendMatchInvitation(matchId: string, playerId: string, localizedTime?: string) {
    const supabase = await createClient()

    // 1. Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    // 2. Fetch match details for the email content
    const { data: match } = await supabase.from('matches').select('title, scheduled_at, location, tenant_id').eq('id', matchId).single()
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

    const token = jwt.sign({ matchId, playerId, tenantId: match.tenant_id }, secret, {
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

    const matchDate = localizedTime || formatDateTime12h(match.scheduled_at)
    const html = generateInvitationEmailHtml(match, matchDate, acceptLink, declineLink)

    await transporter.sendMail({
        from: `"${match.title}" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `Invite: ${match.title}! ⚽`,
        html
    })
}

/** Admin: Send match cost request email to a player */
export async function sendMatchCostEmail(matchId: string, playerId: string, localizedTime: string | undefined, costPerPerson: number) {
    const supabase = await createClient()

    // 1. Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    // 2. Fetch match details
    const { data: match } = await supabase.from('matches').select('title, scheduled_at, location').eq('id', matchId).single()
    if (!match) throw new Error('Match not found')

    // 3. Fetch target player's email
    const { createClient: createPureClient } = await import('@supabase/supabase-js')
    const adminClient = createPureClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(playerId)
    if (userError || !userData?.user?.email) {
        throw new Error('Could not find email for this player')
    }
    const targetEmail = userData.user.email

    // 4. Send the email using Nodemailer
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    })

    const matchDate = localizedTime || formatDateTime12h(match.scheduled_at)
    const html = generateCostEmailHtml(match, matchDate, costPerPerson)

    await transporter.sendMail({
        from: `"Goal Digger" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `Interac e-Transfer Request: ${match.title}`,
        html
    })
}

/** Admin: Send team roster email to all assigned players */
export async function sendTeamRosterEmail(
    matchId: string,
    playerIds: string[],
    team1List: { name: string, pos: string }[],
    team2List: { name: string, pos: string }[],
    localizedTime?: string
) {
    const supabase = await createClient()

    // 1. Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    // 2. Fetch match details
    const { data: match } = await supabase.from('matches').select('title, scheduled_at, location').eq('id', matchId).single()
    if (!match) throw new Error('Match not found')

    const matchDate = localizedTime || formatDateTime12h(match.scheduled_at)

    // 3. Fetch recipient emails
    const { createClient: createPureClient } = await import('@supabase/supabase-js')
    const adminClient = createPureClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const targetEmails: string[] = []

    for (const playerId of playerIds) {
        const { data: userData } = await adminClient.auth.admin.getUserById(playerId)
        const email = userData?.user?.email
        if (email) {
            targetEmails.push(email)
        }
    }

    if (targetEmails.length === 0) return

    // 4. Send the email using Nodemailer
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    })

    const html = generateRosterEmailHtml(match, matchDate, team1List, team2List)

    await transporter.sendMail({
        from: `"Goal Digger" <${process.env.SMTP_USER}>`,
        bcc: targetEmails,
        subject: `Team Roster: ${match.title}`,
        html
    })
}

// === HELPER FUNCTIONS & PREVIEWS ===

function generateInvitationEmailHtml(match: { title: string, location?: string | null }, matchDate: string, acceptLink: string, declineLink: string) {
    return `
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
}

function generateCostEmailHtml(match: { title: string, location?: string | null }, matchDate: string, costPerPerson: number) {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #d69302ff; margin: 0; font-size: 24px; font-weight: 800;">Payment Request</h1>
                <p style="color: #475569; margin-top: 8px;">Please send your e-Transfer for the soccer match.</p>
            </div>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Amount Due</span>
                    <div style="font-size: 36px; font-weight: 900; color: #0f172a; margin-top: 4px;">
                        $${costPerPerson.toFixed(2)}
                    </div>

                <div style="text-align: center;">
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Please send an Interac e-Transfer to:</p>
                    <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; display: inline-block;">
                        <strong style="color: #0f172a; font-size: 18px; letter-spacing: 0.5px; user-select: all;">mamnoon909@gmail.com</strong>
                    </div>
                </div>
                </div>

                <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 0; margin-bottom: 20px;">
                    <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Match</span>
                        <strong style="color: #0f172a; font-size: 14px;">${match.title}</strong>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Date & Time</span>
                        <span style="color: #0f172a; font-size: 14px;">${matchDate}</span>
                    </div>
                    <div style="margin-bottom: 0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Location</span>
                        <span style="color: #0f172a; font-size: 14px;">${match.location || 'TBD'}</span>
                    </div>
                </div>
            </div>

            <footer style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">Thank you for playing!</p>
            </footer>
        </div>
    `
}

function generateRosterEmailHtml(match: { title: string, location?: string | null }, matchDate: string, team1: { name: string, pos: string }[], team2: { name: string, pos: string }[]) {
    const abbrevPos = (pos: string) => {
        if (!pos) return ''
        switch (pos.toLowerCase()) {
            case 'striker': return 'STK'
            case 'midfielder': return 'MID'
            case 'defender': return 'DEF'
            case 'goalkeeper': return 'GK'
            default: return pos.substring(0, 3).toUpperCase()
        }
    }

    const renderTeam = (team: { name: string, pos: string }[], color: string) => {
        return team.map(p => `
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500; color: #334155; text-align: left; vertical-align: middle; line-height: 1.2;">
                    ${p.name}
                </td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: bold; color: ${color}; text-align: right; vertical-align: middle; line-height: 1.2;">
                    ${abbrevPos(p.pos)}
                </td>
            </tr>
        `).join('')
    }

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">Match Roster</h1>
                <p style="color: #475569; margin-top: 8px;">The teams have been finalized for the upcoming match.</p>
            </div>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Match</span>
                    <strong style="color: #0f172a; font-size: 16px;">${match.title}</strong>
                </div>
                <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Date & Time</span>
                    <span style="color: #0f172a; font-size: 16px;">${matchDate}</span>
                </div>
                <div style="margin-bottom: 0;">
                    <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Location</span>
                    <span style="color: #0f172a; font-size: 16px;">${match.location || 'TBD'}</span>
                </div>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                    <td width="48%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; vertical-align: top;">
                        <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-weight: bold; border-bottom: 2px solid #bbf7d0; padding-bottom: 8px;">Team 1</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            ${renderTeam(team1, '#166534')}
                        </table>
                    </td>
                    <td width="4%" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
                    <td width="48%" style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; vertical-align: top;">
                        <h3 style="margin: 0 0 12px 0; color: #ca8a04; font-size: 14px; font-weight: bold; border-bottom: 2px solid #fef08a; padding-bottom: 8px;">Team 2</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            ${renderTeam(team2, '#ca8a04')}
                        </table>
                    </td>
                </tr>
            </table>

            <footer style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">See you on the pitch! ⚽</p>
            </footer>
        </div>
    `
}

export async function getEmailPreview(
    type: 'invitation' | 'cost' | 'roster',
    matchId: string,
    playerIds: string[],
    localizedTime?: string,
    costPerPerson?: number,
    team1List?: { name: string, pos: string }[],
    team2List?: { name: string, pos: string }[]
) {
    const supabase = await createClient()

    // 1. Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase.from('profiles').select('is_admin, is_king').eq('id', user.id).single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    // 2. Fetch match details
    const { data: match } = await supabase.from('matches').select('title, scheduled_at, location').eq('id', matchId).single()
    if (!match) throw new Error('Match not found')
    
    const matchDate = localizedTime || formatDateTime12h(match.scheduled_at)

    // 3. Fetch recipient emails
    const { createClient: createPureClient } = await import('@supabase/supabase-js')
    const adminClient = createPureClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const recipients: { id: string, name: string, email: string }[] = []
    
    // We can fetch profiles to get names
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, nickname').in('id', playerIds)
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    for (const playerId of playerIds) {
        const { data: userData } = await adminClient.auth.admin.getUserById(playerId)
        const email = userData?.user?.email
        if (email) {
            const p = profileMap.get(playerId)
            const name = p ? (p.nickname || `${p.first_name} ${p.last_name}`) : 'Unknown Player'
            recipients.push({ id: playerId, name, email })
        }
    }

    // 4. Generate preview HTML
    let html = ''
    let subject = ''
    if (type === 'invitation') {
        subject = `Invite: ${match.title}! ⚽`
        const acceptLink = '#'
        const declineLink = '#'
        html = generateInvitationEmailHtml(match, matchDate, acceptLink, declineLink)
    } else if (type === 'cost') {
        subject = `Interac e-Transfer Request: ${match.title}`
        html = generateCostEmailHtml(match, matchDate, costPerPerson || 0)
    } else if (type === 'roster') {
        subject = `Team Roster: ${match.title}`
        html = generateRosterEmailHtml(match, matchDate, team1List || [], team2List || [])
    }

    return { subject, html, recipients }
}

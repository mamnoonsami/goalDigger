'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

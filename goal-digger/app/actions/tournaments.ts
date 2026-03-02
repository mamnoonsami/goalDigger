'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ── Create Tournament ── */
export async function createTournament(data: {
    name: string
    description: string
    status: string
    auction_id: string | null
    start_date: string | null
    end_date: string | null
    location: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can create tournaments')

    // Insert tournament
    const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
            name: data.name,
            description: data.description || null,
            status: data.status,
            auction_id: data.auction_id || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            location: data.location || null,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) throw new Error(`Tournament creation failed: ${error.message}`)

    revalidatePath('/tournaments')
    return { id: tournament.id }
}

/* ── Update Tournament ── */
export async function updateTournament(
    id: string,
    data: {
        name: string
        description: string
        status: string
        auction_id: string | null
        start_date: string | null
        end_date: string | null
        location: string
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can update tournaments')

    const { error } = await supabase
        .from('tournaments')
        .update({
            name: data.name,
            description: data.description || null,
            status: data.status,
            auction_id: data.auction_id || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            location: data.location || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) throw new Error(`Update failed: ${error.message}`)

    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/${id}`)
}

/* ── Delete Tournament ── */
export async function deleteTournament(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can delete tournaments')

    const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id)

    if (error) throw new Error(`Delete failed: ${error.message}`)

    revalidatePath('/tournaments')
}

/* ── Join Tournament (For Players) ── */
export async function joinTournament(tournamentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('tournament_players')
        .insert({
            tournament_id: tournamentId,
            player_id: user.id,
        })

    if (error) throw new Error(error.message)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Leave Tournament (For Players) ── */
export async function leaveTournament(tournamentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('tournament_players')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Add Players to Tournament (Admin) ── */
export async function addPlayersToTournament(tournamentId: string, playerIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can add players')

    const rows = playerIds.map(pid => ({
        tournament_id: tournamentId,
        player_id: pid,
    }))

    const { error } = await supabase
        .from('tournament_players')
        .upsert(rows, { onConflict: 'tournament_id,player_id', ignoreDuplicates: true })

    if (error) throw new Error(`Failed to add players: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Remove Player from Tournament (Admin) ── */
export async function removePlayerFromTournament(tournamentId: string, playerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can remove players')

    const { error } = await supabase
        .from('tournament_players')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)

    if (error) throw new Error(`Failed to remove player: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

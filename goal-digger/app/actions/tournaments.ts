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

    // Sync the bidirectional link: set tournament_id on the auction record
    // First, clear tournament_id from any previously linked auction
    await supabase
        .from('auctions')
        .update({ tournament_id: null })
        .eq('tournament_id', id)

    // Then set tournament_id on the newly linked auction
    if (data.auction_id) {
        await supabase
            .from('auctions')
            .update({ tournament_id: id })
            .eq('id', data.auction_id)
    }

    revalidatePath('/tournaments')
    revalidatePath(`/tournaments/${id}`)
    if (data.auction_id) revalidatePath(`/auctions/${data.auction_id}`)
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
export async function addPlayersToTournament(
    tournamentId: string,
    playerIds: string[],
    auctionId?: string | null,
    basePrices?: Record<string, number>
) {
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

    // Sync to auction_players if auction is linked
    if (auctionId && playerIds.length > 0) {
        const auctionRows = playerIds.map((pid, idx) => ({
            auction_id: auctionId,
            player_id: pid,
            base_price: basePrices?.[pid] ?? 20,
            status: 'pending',
            display_order: idx,
        }))
        await supabase
            .from('auction_players')
            .upsert(auctionRows, { onConflict: 'auction_id,player_id', ignoreDuplicates: false })
    }

    revalidatePath(`/tournaments/${tournamentId}`)
    if (auctionId) revalidatePath(`/auctions/${auctionId}`)
}

/* ── Remove Player from Tournament (Admin) ── */
export async function removePlayerFromTournament(tournamentId: string, playerId: string, auctionId?: string | null) {
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

    // Also remove from auction_players if auction is linked
    if (auctionId) {
        await supabase
            .from('auction_players')
            .delete()
            .eq('auction_id', auctionId)
            .eq('player_id', playerId)
    }

    revalidatePath(`/tournaments/${tournamentId}`)
    if (auctionId) revalidatePath(`/auctions/${auctionId}`)
}

/* ── Create Team for Tournament (Admin or Manager) ── */
export async function createTeamForTournament(data: {
    tournament_id: string
    team_name: string
    team_slogan: string
    number_of_players: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_manager')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_manager) throw new Error('Only admins and managers can create teams')

    const { error } = await supabase
        .from('tournament_teams')
        .insert({
            tournament_id: data.tournament_id,
            team_name: data.team_name,
            team_slogan: data.team_slogan || null,
            number_of_players: data.number_of_players,
            manager_id: user.id,
        })

    if (error) throw new Error(`Failed to create team: ${error.message}`)

    revalidatePath(`/tournaments/${data.tournament_id}`)
}

/* ── Update Team (Admin or owning Manager) ── */
export async function updateTeamForTournament(
    teamId: string,
    tournamentId: string,
    data: {
        team_name: string
        team_slogan: string
        number_of_players: number
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_manager')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_manager) throw new Error('Not authorized')

    // Non-admin managers can only update their own teams
    if (!profile.is_admin) {
        const { data: team } = await supabase
            .from('tournament_teams')
            .select('manager_id')
            .eq('id', teamId)
            .single()
        if (team?.manager_id !== user.id) throw new Error('You can only edit your own team')
    }

    const { error } = await supabase
        .from('tournament_teams')
        .update({
            team_name: data.team_name,
            team_slogan: data.team_slogan || null,
            number_of_players: data.number_of_players,
        })
        .eq('id', teamId)

    if (error) throw new Error(`Failed to update team: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Delete Team from Tournament (Admin only) ── */
export async function deleteTeamFromTournament(tournamentId: string, teamId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can delete teams')

    const { error } = await supabase
        .from('tournament_teams')
        .delete()
        .eq('id', teamId)
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to delete team: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

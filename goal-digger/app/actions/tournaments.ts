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
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can create tournaments')

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
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can update tournaments')

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
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can delete tournaments')

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
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can add players')

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
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can remove players')

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
    logo_url?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king, is_manager')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king && !profile?.is_manager) throw new Error('Only admins and managers can create teams')

    const { error } = await supabase
        .from('tournament_teams')
        .insert({
            tournament_id: data.tournament_id,
            team_name: data.team_name,
            team_slogan: data.team_slogan || null,
            number_of_players: data.number_of_players,
            manager_id: user.id,
            logo_url: data.logo_url || null,
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
        logo_url?: string | null
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king, is_manager')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_king && !profile?.is_manager) throw new Error('Not authorized')

    const { error } = await supabase
        .from('tournament_teams')
        .update({
            team_name: data.team_name,
            team_slogan: data.team_slogan || null,
            number_of_players: data.number_of_players,
            logo_url: data.logo_url !== undefined ? data.logo_url : undefined,
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
        .select('is_admin, is_king, is_manager')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king && !profile?.is_manager) throw new Error('Only admins and managers can delete teams')

    const { error } = await supabase
        .from('tournament_teams')
        .delete()
        .eq('id', teamId)
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to delete team: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Assign Players to Team (Admin) ── */
export async function assignPlayersToTeam(
    tournamentId: string,
    teamId: string,
    playerIds: string[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king, is_manager')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king && !profile?.is_manager) throw new Error('Only admins and managers can assign players to teams')

    // First, unassign all players currently on this team
    const { error: unassignError } = await supabase
        .from('tournament_players')
        .update({ team_id: null })
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId)

    if (unassignError) throw new Error(`Failed to unassign players: ${unassignError.message}`)

    // Then assign the selected players to this team
    if (playerIds.length > 0) {
        for (const pid of playerIds) {
            const { error } = await supabase
                .from('tournament_players')
                .update({ team_id: teamId })
                .eq('tournament_id', tournamentId)
                .eq('player_id', pid)

            if (error) throw new Error(`Failed to assign player: ${error.message}`)
        }
    }

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Create Tournament Match (Admin) ── */
export async function createTournamentMatch(data: {
    tournament_id: string
    team_1_id: string
    team_2_id: string
    match_date: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can create tournament matches')

    if (data.team_1_id === data.team_2_id) {
        throw new Error('A team cannot play against itself')
    }

    const { error } = await supabase
        .from('tournament_matches')
        .insert({
            tournament_id: data.tournament_id,
            team_1_id: data.team_1_id,
            team_2_id: data.team_2_id,
            match_date: data.match_date,
            status: 'scheduled'
        })

    if (error) throw new Error(`Failed to create match: ${error.message}`)

    revalidatePath(`/tournaments/${data.tournament_id}`)
}

/* ── Update Tournament Match (Admin) ── */
export async function updateTournamentMatch(data: {
    match_id: string
    tournament_id: string
    team_1_id: string
    team_2_id: string
    match_date: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can update tournament matches')

    if (data.team_1_id === data.team_2_id) {
        throw new Error('A team cannot play against itself')
    }

    const { error } = await supabase
        .from('tournament_matches')
        .update({
            team_1_id: data.team_1_id,
            team_2_id: data.team_2_id,
            match_date: data.match_date,
        })
        .eq('id', data.match_id)

    if (error) throw new Error(`Failed to update match: ${error.message}`)

    revalidatePath(`/tournaments/${data.tournament_id}`)
}


/* ── Delete Tournament Match (Admin) ── */
export async function deleteTournamentMatch(tournamentId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can delete tournament matches')

    const { data: match, error: matchLookupError } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)
        .single()

    if (matchLookupError || !match) throw new Error('Match not found for this tournament')

    const { error: statsError } = await supabase
        .from('tournament_match_stats')
        .delete()
        .eq('tournament_match_id', matchId)

    if (statsError) throw new Error(`Failed to delete match stats: ${statsError.message}`)

    const { error } = await supabase
        .from('tournament_matches')
        .delete()
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to delete match: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Delete All Tournament Matches (Admin) ── */
export async function deleteAllTournamentMatches(tournamentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can delete tournament matches')

    const { data: existingMatches, error: fetchError } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', tournamentId)

    if (fetchError) throw new Error(`Failed to load tournament matches: ${fetchError.message}`)

    const matchIds = existingMatches?.map(match => match.id) ?? []

    if (matchIds.length > 0) {
        const { error: statsError } = await supabase
            .from('tournament_match_stats')
            .delete()
            .in('tournament_match_id', matchIds)

        if (statsError) throw new Error(`Failed to delete match stats: ${statsError.message}`)
    }

    const { error } = await supabase
        .from('tournament_matches')
        .delete()
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to delete tournament matches: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Reset Tournament Match (Admin) ── */
export async function resetTournamentMatch(tournamentId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can reset tournament matches')

    const { data: match, error: matchLookupError } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)
        .single()

    if (matchLookupError || !match) throw new Error('Match not found for this tournament')

    const { error: statsError } = await supabase
        .from('tournament_match_stats')
        .delete()
        .eq('tournament_match_id', matchId)

    if (statsError) throw new Error(`Failed to reset match stats: ${statsError.message}`)

    const { error } = await supabase
        .from('tournament_matches')
        .update({
            team_1_score: 0,
            team_2_score: 0,
            status: 'scheduled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to reset match: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Mark Tournament Match as Ongoing (Admin) ── */
export async function markTournamentMatchAsOngoing(tournamentId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can mark ongoing matches')

    // Clear any existing ongoing match in this tournament
    await supabase
        .from('tournament_matches')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .eq('tournament_id', tournamentId)
        .eq('status', 'ongoing')

    const { error } = await supabase
        .from('tournament_matches')
        .update({ status: 'ongoing', updated_at: new Date().toISOString() })
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to mark match as ongoing: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Unmark Tournament Match as Ongoing (Admin) ── */
export async function unmarkTournamentMatchAsOngoing(tournamentId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can update match status')

    const { error } = await supabase
        .from('tournament_matches')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)
        .eq('status', 'ongoing')

    if (error) throw new Error(`Failed to unmark ongoing match: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Mark Tournament Match as Final (Admin) ── */
export async function markTournamentMatchAsFinal(tournamentId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can mark tournament finals')

    const { data: match, error: matchLookupError } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)
        .single()

    if (matchLookupError || !match) throw new Error('Match not found for this tournament')

    const { error: clearError } = await supabase
        .from('tournament_matches')
        .update({ is_final: false, updated_at: new Date().toISOString() })
        .eq('tournament_id', tournamentId)
        .eq('is_final', true)

    if (clearError) throw new Error(`Failed to clear existing final: ${clearError.message}`)

    const { error } = await supabase
        .from('tournament_matches')
        .update({ is_final: true, updated_at: new Date().toISOString() })
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)

    if (error) throw new Error(`Failed to mark final match: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Unmark Tournament Match as Final (Admin) ── */
export async function unmarkTournamentMatchAsFinal(tournamentId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can update tournament finals')

    const { error } = await supabase
        .from('tournament_matches')
        .update({ is_final: false, updated_at: new Date().toISOString() })
        .eq('id', matchId)
        .eq('tournament_id', tournamentId)
        .eq('is_final', true)

    if (error) throw new Error(`Failed to remove final match: ${error.message}`)

    revalidatePath(`/tournaments/${tournamentId}`)
}

/* ── Record Tournament Match Score (Admin) ── */
export async function recordTournamentMatchScore(
    matchId: string,
    tournamentId: string,
    data: {
        team_1_score: number
        team_2_score: number
        player_stats: { player_id: string, team_id: string, goals: number, assists: number }[]
        mark_completed?: boolean
    }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can record match scores')

    // 1. Update the match score and status
    const { error: matchError } = await supabase
        .from('tournament_matches')
        .update({
            team_1_score: data.team_1_score,
            team_2_score: data.team_2_score,
            status: data.mark_completed ? 'completed' : 'scheduled',
            updated_at: new Date().toISOString()
        })
        .eq('id', matchId)

    if (matchError) throw new Error(`Failed to update match score: ${matchError.message}`)

    // 2. Clear existing stats for this match (if updating)
    await supabase
        .from('tournament_match_stats')
        .delete()
        .eq('tournament_match_id', matchId)

    // 3. Insert new stats
    const statsToInsert = data.player_stats.filter(p => p.goals > 0 || p.assists > 0).map(p => ({
        tournament_match_id: matchId,
        player_id: p.player_id,
        team_id: p.team_id,
        goals: p.goals,
        assists: p.assists
    }))

    if (statsToInsert.length > 0) {
        const { error: statsError } = await supabase
            .from('tournament_match_stats')
            .insert(statsToInsert)

        if (statsError) throw new Error(`Failed to record player stats: ${statsError.message}`)
    }

    revalidatePath(`/tournaments/${tournamentId}`)
}

import { createClient } from '../lib/supabase/client'
import type { Match, MatchSignup, RecordStatPayload } from '../types/match.types'
import { balanceTeams, profileToBalanceInput } from '../lib/teamBalancer'

/**
 * Fetch all matches, most recent first.
 */
export async function getMatches(): Promise<Match[]> {
    const supabase = createClient()
    const { data } = await supabase
        .from('matches')
        .select('*')
        .order('scheduled_at', { ascending: false })
    return data ?? []
}

/**
 * Fetch a single match by ID.
 */
export async function getMatchById(id: string): Promise<Match | null> {
    const supabase = createClient()
    const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()
    return data ?? null
}

/**
 * Fetch all signups for a given match, including the player's profile.
 */
export async function getMatchSignups(matchId: string): Promise<MatchSignup[]> {
    const supabase = createClient()
    const { data } = await supabase
        .from('match_signups')
        .select('*, profiles(*)')
        .eq('match_id', matchId)
    return (data as MatchSignup[]) ?? []
}

/**
 * Sign the current user up for a match.
 */
export async function signUpForMatch(matchId: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await supabase
        .from('match_signups')
        .insert({ match_id: matchId, player_id: user.id })
}

/**
 * Remove the current user's signup for a match.
 */
export async function withdrawFromMatch(matchId: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await supabase
        .from('match_signups')
        .delete()
        .eq('match_id', matchId)
        .eq('player_id', user.id)
}

/**
 * Admin: run the team balancer and persist team assignments (1 or 2).
 * Fetches signed-up players' profiles, balances, and updates in one go.
 */
export async function generateAndSaveTeams(matchId: string): Promise<{
    team1: string[]
    team2: string[]
}> {
    const supabase = createClient()

    // Fetch signups with player profiles
    const { data: signups } = await supabase
        .from('match_signups')
        .select('player_id, profiles(id, base_score, goals)')
        .eq('match_id', matchId)

    if (!signups || signups.length < 2) {
        throw new Error('Not enough players to balance teams')
    }

    const players = signups.map((s: any) =>
        profileToBalanceInput(s.profiles)
    )

    const { team1, team2 } = balanceTeams(players)

    // Persist team assignments
    const updates = [
        ...team1.map((pid) => ({ match_id: matchId, player_id: pid, team: 1 })),
        ...team2.map((pid) => ({ match_id: matchId, player_id: pid, team: 2 })),
    ]

    for (const update of updates) {
        await supabase
            .from('match_signups')
            .update({ team: update.team })
            .eq('match_id', update.match_id)
            .eq('player_id', update.player_id)
    }

    // Advance match status
    await supabase
        .from('matches')
        .update({ status: 'balanced', updated_at: new Date().toISOString() })
        .eq('id', matchId)

    return { team1, team2 }
}

/**
 * Admin: record goals/assists for all players after a match.
 * Increments the player's career goals via an RPC to avoid race conditions.
 */
export async function recordMatchStats(
    matchId: string,
    stats: RecordStatPayload[]
): Promise<void> {
    const supabase = createClient()

    for (const { player_id, goals, assists } of stats) {
        // 1. Store the per-match record
        await supabase.from('match_stats').upsert({
            match_id: matchId,
            player_id,
            goals,
            assists,
        })

        // 2. Increment career totals via DB function (atomic)
        if (goals > 0) {
            await supabase.rpc('increment_player_goals', { pid: player_id, g: goals })
        }
    }

    // Mark match as completed
    await supabase
        .from('matches')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', matchId)
}

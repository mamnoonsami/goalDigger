import { createClient } from '../lib/supabase/client'
import type { Tournament, TournamentPlayer } from '../types/tournament.types'

export async function getTournaments(): Promise<Tournament[]> {
    const supabase = createClient()
    const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
    return data ?? []
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
    const supabase = createClient()
    const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()
    return data ?? null
}

export async function getTournamentPlayers(
    tournamentId: string
): Promise<TournamentPlayer[]> {
    const supabase = createClient()
    const { data } = await supabase
        .from('tournament_players')
        .select('*, profiles(*)')
        .eq('tournament_id', tournamentId)
    return (data as TournamentPlayer[]) ?? []
}

/**
 * Admin: advance tournament to auction phase.
 */
export async function startAuction(tournamentId: string): Promise<void> {
    const supabase = createClient()
    await supabase
        .from('tournaments')
        .update({
            status: 'auction',
            auction_start_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', tournamentId)
}

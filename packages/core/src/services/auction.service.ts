import { createClient } from '../lib/supabase/client'
import type { Bid } from '../types/auction.types'

/**
 * Fetch all bids for a specific tournament player slot, ordered by amount descending.
 */
export async function getBidsForPlayer(
    tournamentPlayerId: string
): Promise<Bid[]> {
    const supabase = createClient()
    const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('tournament_player_id', tournamentPlayerId)
        .order('amount', { ascending: false })
    return (data as Bid[]) ?? []
}

/**
 * Place a bid on a player in the auction.
 * The manager_id is injected from the current user's session.
 */
export async function placeBid(payload: {
    tournamentId: string
    tournamentPlayerId: string
    amount: number
}): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await supabase.from('bids').insert({
        tournament_id: payload.tournamentId,
        tournament_player_id: payload.tournamentPlayerId,
        manager_id: user.id,
        amount: payload.amount,
        status: 'active',
    })
}

/**
 * Admin: mark a bid as won and close the slot.
 */
export async function closeBidding(
    tournamentPlayerId: string,
    winningBidId: string,
    winningManagerId: string,
    soldPrice: number
): Promise<void> {
    const supabase = createClient()

    // Outbid all other active bids
    await supabase
        .from('bids')
        .update({ status: 'outbid' })
        .eq('tournament_player_id', tournamentPlayerId)
        .neq('id', winningBidId)

    // Mark the winner
    await supabase
        .from('bids')
        .update({ status: 'won' })
        .eq('id', winningBidId)

    // Record sale on tournament_players
    await supabase
        .from('tournament_players')
        .update({ sold_to: winningManagerId, sold_price: soldPrice })
        .eq('id', tournamentPlayerId)
}

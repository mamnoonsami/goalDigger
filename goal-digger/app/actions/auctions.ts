'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ── Create Auction ── */
export async function createAuction(data: {
    title: string
    description: string
    scheduled_at: string
    bid_timer_seconds: number
    budget_per_manager: number
    max_players_per_team: number
    players: { player_id: string; base_price: number }[]
    managerIds?: string[]
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
    if (!profile?.is_admin) throw new Error('Only admins can create auctions')

    // Insert auction
    const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .insert({
            title: data.title,
            description: data.description,
            scheduled_at: data.scheduled_at,
            bid_timer_seconds: data.bid_timer_seconds,
            budget_per_manager: data.budget_per_manager,
            max_players_per_team: data.max_players_per_team,
            status: 'draft',
            created_by: user.id,
        })
        .select()
        .single()

    if (auctionError) throw new Error(`Auction insert failed: ${auctionError.message}`)


    // Insert auction players
    if (data.players.length > 0) {
        const playerRows = data.players.map((p, i) => ({
            auction_id: auction.id,
            player_id: p.player_id,
            base_price: p.base_price,
            status: 'pending',
            display_order: i + 1,
        }))

        const { error: playersError } = await supabase
            .from('auction_players')
            .insert(playerRows)

        if (playersError) {
            console.error('Failed to insert players:', playersError)
            throw new Error(`Player insert failed: ${playersError.message}`)
        }
    }

    // Insert auction managers if provided
    if (data.managerIds && data.managerIds.length > 0) {
        const managerRows = data.managerIds.map(managerId => ({
            auction_id: auction.id,
            manager_id: managerId,
        }))

        const { error: managersError } = await supabase
            .from('auction_managers')
            .insert(managerRows)

        if (managersError) {
            console.error('Failed to insert managers:', managersError)
            // Log error but don't fail full auction creation
        }
    }

    revalidatePath('/auctions')
    return { id: auction.id }
}

/* ── Update Auction ── */
export async function updateAuction(
    id: string,
    data: {
        title?: string
        description?: string
        scheduled_at?: string
        bid_timer_seconds?: number
        budget_per_manager?: number
        max_players_per_team?: number
        status?: string
    }
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('auctions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/auctions')
    revalidatePath(`/auctions/${id}`)
}

/* ── Delete Auction ── */
/* CASCADE in DB automatically removes auction_players and auction_bids */
export async function deleteAuction(id: string) {
    const supabase = await createClient()

    // Only allow deleting draft auctions
    const { data: auction } = await supabase
        .from('auctions')
        .select('status')
        .eq('id', id)
        .single()

    if (!auction) throw new Error('Auction not found')
    if (auction.status !== 'draft') throw new Error('Can only delete draft auctions')

    const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/auctions')
}

/* ── Mark Player Sold ── */
export async function markPlayerSold(auctionId: string, playerId: string, price: number, soldTo: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can modify auction players')

    const { error } = await supabase
        .from('auction_players')
        .update({ status: 'sold', sold_price: price, sold_to: soldTo })
        .eq('auction_id', auctionId)
        .eq('player_id', playerId)

    if (error) throw new Error(error.message)

    revalidatePath(`/auctions/${auctionId}`)
}

/* ── Mark Player Unsold ── */
export async function markPlayerUnsold(auctionId: string, playerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can modify auction players')

    const { error } = await supabase
        .from('auction_players')
        .update({ status: 'unsold', sold_price: null })
        .eq('auction_id', auctionId)
        .eq('player_id', playerId)

    if (error) throw new Error(error.message)

    revalidatePath(`/auctions/${auctionId}`)
}

/* ── Reset Auction Players ── */
export async function resetAuctionPlayers(auctionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin) throw new Error('Only admins can modify auction players')

    const { error } = await supabase
        .from('auction_players')
        .update({ status: 'pending', sold_price: null, sold_to: null })
        .eq('auction_id', auctionId)

    if (error) throw new Error(error.message)

    revalidatePath(`/auctions/${auctionId}`)
}

/* ── Join Auction (For Managers) ── */
export async function joinAuction(auctionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('auction_managers')
        .insert({
            auction_id: auctionId,
            manager_id: user.id
        })

    if (error) throw new Error(error.message)

    revalidatePath(`/auctions/${auctionId}`)
}

/* ── Leave Auction (For Managers) ── */
export async function leaveAuction(auctionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('auction_managers')
        .delete()
        .eq('auction_id', auctionId)
        .eq('manager_id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath(`/auctions/${auctionId}`)
}

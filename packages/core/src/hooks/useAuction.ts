'use client'

import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../lib/supabase/client'
import { useAuctionStore } from '../store/auctionStore'
import { placeBid } from '../services/auction.service'
import type { Bid } from '../types/auction.types'

/**
 * Subscribes to real-time bid events for a specific tournament
 * and wires new bids into the Zustand auction store.
 *
 * Usage: call inside the auction page component.
 */
export function useAuctionRealtime(tournamentId: string) {
    const applyBid = useAuctionStore((s) => s.applyBid)

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`auction:${tournamentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bids',
                    filter: `tournament_id=eq.${tournamentId}`,
                },
                (payload) => applyBid(payload.new as Bid)
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tournamentId, applyBid])
}

/**
 * Mutation hook for placing a bid.
 * Invalidates bids cache after success.
 */
export function usePlaceBid(tournamentId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            tournamentPlayerId,
            amount,
        }: {
            tournamentPlayerId: string
            amount: number
        }) => placeBid({ tournamentId, tournamentPlayerId, amount }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tournament', tournamentId, 'players'] })
        },
    })
}

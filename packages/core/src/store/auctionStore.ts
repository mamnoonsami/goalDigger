import { create } from 'zustand'
import type { TournamentPlayer } from '../types/tournament.types'
import type { Bid, AuctionPhase } from '../types/auction.types'

interface AuctionState {
    currentPlayer: TournamentPlayer | null
    highestBid: Bid | null
    timeRemaining: number // seconds
    phase: AuctionPhase

    // Actions
    setCurrentPlayer: (player: TournamentPlayer) => void
    applyBid: (bid: Bid) => void
    tick: () => void
    closeRound: (outcome: 'sold' | 'unsold') => void
    reset: () => void
}

const INITIAL_TIMER = 30 // seconds per player

export const useAuctionStore = create<AuctionState>((set) => ({
    currentPlayer: null,
    highestBid: null,
    timeRemaining: INITIAL_TIMER,
    phase: 'idle',

    setCurrentPlayer: (player) =>
        set({
            currentPlayer: player,
            phase: 'bidding',
            timeRemaining: INITIAL_TIMER,
            highestBid: null,
        }),

    applyBid: (bid) =>
        set((state) => ({
            highestBid: bid,
            // Reset timer to at least 10 s when a new bid comes in
            timeRemaining: Math.max(state.timeRemaining, 10),
        })),

    tick: () =>
        set((state) => ({
            timeRemaining: Math.max(0, state.timeRemaining - 1),
        })),

    closeRound: (outcome) =>
        set({ phase: outcome }),

    reset: () =>
        set({
            currentPlayer: null,
            highestBid: null,
            timeRemaining: INITIAL_TIMER,
            phase: 'idle',
        }),
}))

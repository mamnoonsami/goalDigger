export type BidStatus = 'active' | 'won' | 'outbid' | 'cancelled'

export interface Bid {
    id: string
    tournament_id: string
    tournament_player_id: string
    manager_id: string
    amount: number
    status: BidStatus
    placed_at: string
}

/** Phase of the live auction for a single player slot */
export type AuctionPhase = 'idle' | 'bidding' | 'sold' | 'unsold'

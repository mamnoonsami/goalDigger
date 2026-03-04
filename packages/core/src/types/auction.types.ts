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

export interface Auction {
    id: string
    title: string
    description: string
    scheduled_at: string
    bid_timer_seconds: number
    budget_per_manager: number
    max_players_per_team: number
    status: 'draft' | 'live' | 'completed'
    created_at: string
    updated_at: string
}

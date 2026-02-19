export type TournamentStatus = 'draft' | 'auction' | 'active' | 'completed'

export interface Tournament {
    id: string
    name: string
    description: string | null
    auction_start_at: string | null
    auction_end_at: string | null
    budget_per_manager: number
    status: TournamentStatus
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface TournamentPlayer {
    id: string
    tournament_id: string
    player_id: string
    base_price: number
    sold_to: string | null
    sold_price: number | null
}

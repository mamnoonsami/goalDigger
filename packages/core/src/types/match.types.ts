export type MatchStatus = 'open' | 'balanced' | 'in_progress' | 'completed' | 'cancelled'

export interface Match {
    id: string
    title: string
    scheduled_at: string
    location: string | null
    status: MatchStatus
    max_players: number
    created_by: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface MatchSignup {
    id: string
    match_id: string
    player_id: string
    /** 1 or 2 — assigned after team balancing */
    team: 1 | 2 | null
    signed_up_at: string
}

export interface MatchStat {
    id: string
    match_id: string
    player_id: string
    goals: number
    assists: number
    recorded_by: string | null
    created_at: string
}

/** Payload for recording stats after a match */
export interface RecordStatPayload {
    player_id: string
    goals: number
    assists: number
}

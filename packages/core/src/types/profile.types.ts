export type UserRole = 'admin' | 'manager' | 'player' | 'viewer'
export type Position = 'goalkeeper' | 'defender' | 'midfielder' | 'forward'

export interface Profile {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    role: UserRole
    is_admin: boolean
    is_manager: boolean
    is_player: boolean
    is_viewer: boolean
    player_position: Position | null
    /** Admin-assigned base score (1–100) */
    base_score: number
    /** Career goals — incremented after each match */
    goals: number
    matches_played: number
    /** Budget allocated for auctions (managers only) */
    auction_budget: number
    created_at: string
    updated_at: string
}

/** Derived display name */
export function fullName(profile: Pick<Profile, 'first_name' | 'last_name'>): string {
    return `${profile.first_name} ${profile.last_name}`
}

/** Convenience: effective score used for team balancing */
export function effectiveScore(profile: Pick<Profile, 'base_score' | 'goals'>): number {
    return profile.base_score + profile.goals * 2
}

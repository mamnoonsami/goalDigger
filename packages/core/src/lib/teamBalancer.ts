import type { Profile } from '../types/profile.types'

export interface PlayerForBalance {
    id: string
    base_score: number
    goals: number
}

/**
 * Compute a player's effective score for team balancing.
 * Formula: base_score (admin-set, 1–100) + goals * 2
 */
export function effectiveScore(player: PlayerForBalance): number {
    return player.base_score + player.goals * 2
}

/**
 * Splits players into two balanced teams using a greedy snake-draft
 * on descending effective score. The total score difference between
 * teams will always be minimal (< 1 player's score).
 */
export function balanceTeams(players: PlayerForBalance[]): {
    team1: string[]
    team2: string[]
} {
    const sorted = [...players].sort(
        (a, b) => effectiveScore(b) - effectiveScore(a)
    )

    const team1: string[] = []
    const team2: string[] = []
    let t1Total = 0
    let t2Total = 0

    for (const player of sorted) {
        const s = effectiveScore(player)
        if (t1Total <= t2Total) {
            team1.push(player.id)
            t1Total += s
        } else {
            team2.push(player.id)
            t2Total += s
        }
    }

    return { team1, team2 }
}

/** Maps a full Profile to the minimal shape needed for balancing */
export function profileToBalanceInput(profile: Profile): PlayerForBalance {
    return {
        id: profile.id,
        base_score: profile.base_score,
        goals: profile.goals,
    }
}

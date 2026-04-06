import { createClient } from '../../../lib/supabase/server'
import { PlayersTabs } from './PlayersTabs'

export default async function PlayersPage() {
    const supabase = await createClient()
    const { data: rawPlayers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played')
        .eq('is_player', true)

    // Sort by effective score (base_score + goals × 2), descending
    const players = (rawPlayers ?? []).sort((a, b) => (b.base_score + b.goals * 2) - (a.base_score + a.goals * 2))

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Players</h1>
                <p className="mt-1 text-sm text-text-muted">Leaderboard ranked by effective score (base + goals × 2) grouped by position.</p>
            </div>

            <PlayersTabs players={players} />
        </div>
    )
}

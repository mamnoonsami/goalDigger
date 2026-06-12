import { createClient } from '../../../lib/supabase/server'
import { PlayersTabs } from './PlayersTabs'

export default async function PlayersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user
        ? await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
        : { data: null }

    const { data: rawPlayers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played, peer_rating_score')
        .eq('is_player', true)
        .eq('tenant_id', profile?.tenant_id)

    // Sort by peer rating score, descending
    const players = (rawPlayers ?? []).sort((a, b) => (b.peer_rating_score ?? 0) - (a.peer_rating_score ?? 0))

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Players</h1>
                <p className="mt-1 text-sm text-text-muted">Leaderboard ranked by peer rating grouped by position.</p>
            </div>

            <PlayersTabs players={players} />
        </div>
    )
}

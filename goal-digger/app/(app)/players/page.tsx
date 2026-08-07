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
        .eq('is_active', true)
        .eq('tenant_id', profile?.tenant_id)

    // Sort by peer rating score, descending
    const players = (rawPlayers ?? []).sort((a, b) => (b.peer_rating_score ?? 0) - (a.peer_rating_score ?? 0))
    const ratedPlayers = players.filter((player) => typeof player.peer_rating_score === 'number')
    const averageRating = ratedPlayers.length > 0
        ? (ratedPlayers.reduce((total, player) => total + (player.peer_rating_score ?? 0), 0) / ratedPlayers.length).toFixed(1)
        : '—'
    const totalGoals = players.reduce((total, player) => total + (player.goals ?? 0), 0)

    return (
        <div className="flex min-w-0 flex-col gap-6 overflow-hidden lg:gap-8">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Player rankings</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">The squad, ranked.</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Compare peer ratings across the squad and see who leads every position.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-xl border border-border bg-surface-2 px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium text-text-muted">Active players</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{players.length}</p>
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.08] px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium text-accent/80">Average rating</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-accent">{averageRating}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-border bg-surface-2 px-4 py-4 sm:col-span-1 sm:px-5">
                    <p className="text-xs font-medium text-text-muted">Goals scored</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{totalGoals}</p>
                </div>
            </div>

            <PlayersTabs players={players} />
        </div>
    )
}

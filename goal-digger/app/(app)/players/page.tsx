import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'

export default async function PlayersPage() {
    const supabase = await createClient()
    const { data: players } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played')
        .in('role', ['player', 'admin', 'manager'])
        .order('base_score', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Players</h1>
                <p className="mt-1 text-sm text-text-muted">Leaderboard ranked by effective score (base + goals × 2).</p>
            </div>

            {players && players.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {players.map((p, i) => {
                        const score = p.base_score + p.goals * 2
                        return (
                            <Card key={p.id} className="flex items-center gap-4">
                                <span className="font-mono text-2xl font-black text-text-muted w-8 shrink-0 text-center">
                                    {i + 1}
                                </span>
                                <Avatar
                                    firstName={p.first_name}
                                    lastName={p.last_name}
                                    avatarUrl={p.avatar_url}
                                    size="md"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-text-primary truncate">
                                        {p.first_name} {p.last_name}
                                    </p>
                                    <p className="text-xs text-text-muted capitalize">
                                        {p.player_position ?? 'Unknown position'} · {p.goals}G · {p.matches_played} matches
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className="font-mono text-lg font-bold text-accent">{score}</span>
                                    <Badge variant="slate">{p.role}</Badge>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <p className="py-10 text-center text-sm text-text-muted">No players yet.</p>
                </Card>
            )}
        </div>
    )
}

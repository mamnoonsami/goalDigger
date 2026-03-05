import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import Link from 'next/link'

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
                <p className="mt-1 text-sm text-text-muted">Leaderboard ranked by effective score (base + goals × 2).</p>
            </div>

            {players && players.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-w-0">
                    {players.map((p, i) => {
                        const score = p.base_score + p.goals * 2
                        const rankColor = i < 3 ? 'text-yellow-600' : 'text-text-muted'
                        const borderColor = i < 3 ? 'ring-2 ring-yellow-600' : ''
                        return (
                            <Link key={p.id} href={`/players/${p.id}`}>
                                <Card className={`flex items-center gap-1.5 sm:gap-4 !p-2.5 sm:!p-5 hover:border-accent/40 transition-colors cursor-pointer ${i < 3 ? 'border-l-2 border-l-yellow-600' : ''}`}>
                                    <span className={`font-mono text-base sm:text-2xl font-black w-5 sm:w-8 shrink-0 text-center ${rankColor}`}>
                                        {i + 1}
                                    </span>
                                    <div className={`shrink-0 rounded-full ${borderColor}`}>
                                        <Avatar
                                            firstName={p.first_name}
                                            lastName={p.last_name}
                                            avatarUrl={p.avatar_url}
                                            size="sm"
                                            className="sm:!h-10 sm:!w-10"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-text-primary truncate text-sm sm:text-base">
                                            {p.first_name} {p.last_name}
                                        </p>
                                        <p className="text-[11px] sm:text-xs text-text-muted capitalize truncate">
                                            {p.player_position ?? 'Unknown'} · {p.goals}G · {p.matches_played}M
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                        <span className="font-mono text-sm sm:text-lg font-bold text-accent">{score}</span>
                                        <Badge variant="slate">{p.role}</Badge>
                                    </div>
                                </Card>
                            </Link>
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

import { createClient } from '../../../../lib/supabase/server'
import { Card } from '../../../../components/ui/Card'
import { Avatar } from '../../../../components/ui/Avatar'
import { Badge, roleVariant } from '../../../../components/ui/Badge'
import { PlayerDetailClient } from '../../../../components/players/PlayerDetailClient'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PlayerDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Parallel fetches
    const [
        { data: { user } },
        { data: player },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played, created_at')
            .eq('id', id)
            .single(),
    ])

    if (!player) notFound()

    // Check if viewer is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin ?? false
    const effectiveScore = player.base_score + player.goals * 2

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/players" className="hover:text-accent transition-colors">Players</Link>
                <span>/</span>
                <span className="text-text-primary font-medium">{player.first_name} {player.last_name}</span>
            </div>

            {/* Player Header */}
            <Card>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                    <Avatar
                        firstName={player.first_name}
                        lastName={player.last_name}
                        avatarUrl={player.avatar_url}
                        size="lg"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-text-primary">
                                {player.first_name} {player.last_name}
                            </h1>
                            <Badge variant={roleVariant[player.role] ?? 'slate'}>
                                {player.role}
                            </Badge>
                        </div>
                        <p className="text-sm text-text-muted capitalize">
                            {player.player_position ?? 'No position set'}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                            Joined {new Date(player.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <PlayerDetailClient player={player} isAdmin={isAdmin} />
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <Card className="flex flex-col items-center text-center py-5">
                    <span className="text-3xl font-black text-accent font-mono">{effectiveScore}</span>
                    <span className="text-xs text-text-muted mt-1">Effective Score</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-5">
                    <span className="text-3xl font-black text-text-primary font-mono">{player.base_score}</span>
                    <span className="text-xs text-text-muted mt-1">Base Score</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-5">
                    <span className="text-3xl font-black text-text-primary font-mono">{player.goals}</span>
                    <span className="text-xs text-text-muted mt-1">Goals</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-5">
                    <span className="text-3xl font-black text-text-primary font-mono">{player.matches_played}</span>
                    <span className="text-xs text-text-muted mt-1">Matches Played</span>
                </Card>
            </div>

            {/* Score Breakdown */}
            <Card>
                <h2 className="font-semibold text-text-primary mb-3">Score Breakdown</h2>
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-text-muted">Base Score</span>
                        <span className="font-mono font-medium text-text-primary">{player.base_score}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-muted">Goal Bonus ({player.goals} × 2)</span>
                        <span className="font-mono font-medium text-text-primary">+{player.goals * 2}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                        <span className="font-medium text-text-primary">Effective Score</span>
                        <span className="font-mono font-bold text-accent">{effectiveScore}</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}

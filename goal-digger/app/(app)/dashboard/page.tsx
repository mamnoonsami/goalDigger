import { createClient } from '../../../lib/supabase/server'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { Badge, roleVariant, statusVariant } from '../../../components/ui/Badge'
import Link from 'next/link'
import { UpcomingMatches } from '../../../components/dashboard/UpcomingMatches'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: profile }, { data: matches }, { data: players }] = await Promise.all([
        supabase
            .from('profiles')
            .select('first_name, last_name, role, is_admin, is_manager, base_score, goals, matches_played, player_position')
            .eq('id', user!.id)
            .single(),
        supabase
            .from('matches')
            .select('id, title, status, scheduled_at, location, max_players, notes')
            .order('scheduled_at', { ascending: true })
            .limit(5),
        supabase
            .from('profiles')
            .select('id, first_name, last_name, base_score, goals, role')
            .eq('is_player', true)
            .order('base_score', { ascending: false })
            .limit(20),
    ])

    // Sort by effective score and take top 5
    const topPlayers = (players ?? [])
        .sort((a, b) => (b.base_score + b.goals * 2) - (a.base_score + a.goals * 2))
        .slice(0, 5)

    const effectiveScore = profile
        ? profile.base_score + profile.goals * 2
        : 0

    return (
        <div className="flex flex-col gap-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">
                    Welcome back, {profile?.first_name ?? 'Player'} 👋
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                    Here&apos;s what&apos;s happening in your squad.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Your Score"
                    value={effectiveScore}
                    icon={<span>⭐</span>}
                />
                <StatCard
                    label="Goals"
                    value={profile?.goals ?? 0}
                    icon={<span>⚽</span>}
                />
                <StatCard
                    label="Matches Played"
                    value={profile?.matches_played ?? 0}
                    icon={<span>📅</span>}
                />
                <StatCard
                    label="Base Score"
                    value={profile?.base_score ?? 50}
                    icon={<span>📊</span>}
                />
            </div>

            {/* 2-column grid on md+ */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Upcoming matches */}
                <UpcomingMatches
                    matches={matches}
                    isAdmin={profile?.is_admin || false}
                />

                {/* Top players */}
                <Card padding="none">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="font-semibold text-text-primary">Top Players</h2>
                        <Link href="/players" className="text-xs text-accent hover:underline">View all →</Link>
                    </div>
                    {topPlayers.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {topPlayers.map((p, i) => (
                                <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <span className="font-mono text-sm font-bold text-text-muted w-5">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-text-primary">
                                            {p.first_name} {p.last_name}
                                        </p>
                                        <p className="text-xs text-text-muted">{p.goals} goals</p>
                                    </div>
                                    <Badge variant={roleVariant[p.role] ?? 'slate'}>{p.role}</Badge>
                                    <span className="font-mono text-sm font-bold text-accent">
                                        {p.base_score + p.goals * 2}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-5 py-8 text-center text-sm text-text-muted">No players yet.</p>
                    )}
                </Card>
            </div>
        </div>
    )
}

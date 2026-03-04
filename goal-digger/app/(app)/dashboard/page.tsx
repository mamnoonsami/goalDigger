import { createClient } from '../../../lib/supabase/server'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { Badge, roleVariant, statusVariant } from '../../../components/ui/Badge'
import Link from 'next/link'
import { UpcomingMatches } from '../../../components/dashboard/UpcomingMatches'
import { OngoingAuctions } from '../../../components/dashboard/OngoingAuctions'
import { TopPlayersList } from '../../../components/dashboard/TopPlayersList'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: profile }, { data: matches }, { data: players }, { data: auctions }] = await Promise.all([
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
            .select('id, first_name, last_name, base_score, goals, role, matches_played, player_position, avatar_url')
            .eq('is_player', true)
            .order('base_score', { ascending: false })
            .limit(20),
        supabase
            .from('auctions')
            .select('id, title, status, scheduled_at')
            .order('scheduled_at', { ascending: false })
            .limit(5),
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Upcoming matches */}
                <UpcomingMatches
                    matches={matches}
                    isAdmin={profile?.is_admin || false}
                />

                {/* Ongoing auctions */}
                <OngoingAuctions
                    auctions={auctions}
                />

                {/* Top players */}
                <Card padding="none">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="font-semibold text-text-primary">Top Players</h2>
                        <Link href="/players" className="text-xs text-accent hover:underline">View all →</Link>
                    </div>
                    <TopPlayersList players={topPlayers} />
                </Card>
            </div>
        </div>
    )
}

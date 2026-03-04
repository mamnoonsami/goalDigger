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
                    valueColor="#22c55e"
                    icon={
                        <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>
                    }
                />
                <StatCard
                    label="Goals"
                    value={profile?.goals ?? 0}
                    valueColor="#38bdf8"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2v4l3.5 2.5L20 7M12 2l-3.5 6.5L12 12l3.5-3.5M12 12l-3.5-3.5L4 7l4.5 1.5M12 12l-4.5 3L4 17l4.5-2M12 12l4.5 3L20 17l-4.5-2M12 12v5l-3.5 3M12 17l3.5 3" />
                        </svg>
                    }
                />
                <StatCard
                    label="Matches Played"
                    value={profile?.matches_played ?? 0}
                    valueColor="#f59e0b"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    }
                />
                <StatCard
                    label="Base Score"
                    value={profile?.base_score ?? 50}
                    valueColor="#a78bfa"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                    }
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

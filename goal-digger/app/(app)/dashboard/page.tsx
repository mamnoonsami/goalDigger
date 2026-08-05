import { createClient } from '../../../lib/supabase/server'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import Link from 'next/link'
import { UpcomingMatches } from '../../../components/dashboard/UpcomingMatches'
import { OngoingAuctions } from '../../../components/dashboard/OngoingAuctions'
import { TopPlayersList } from '../../../components/dashboard/TopPlayersList'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch user profile first to get roles and tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role, is_admin, is_king, is_manager, is_player, base_score, goals, matches_played, player_position, peer_rating_score, tenant_id')
        .eq('id', user!.id)
        .single()

    // 2. Fetch matches, players in same tenant, and auctions
    const [{ data: matches }, { data: players }, { data: auctions }] = await Promise.all([
        supabase
            .from('matches')
            .select('id, title, status, scheduled_at, location, max_players, notes, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
        supabase
            .from('profiles')
            .select('id, first_name, last_name, base_score, goals, role, matches_played, player_position, avatar_url, peer_rating_score')
            .eq('is_player', true)
            .eq('tenant_id', profile?.tenant_id)
            .limit(100),
        supabase
            .from('auctions')
            .select('id, title, status, scheduled_at')
            .order('scheduled_at', { ascending: false })
            .limit(5),
    ])

    // Group players by position and find the best
    const playersList = players ?? []
    const positions = ['striker', 'midfielder', 'defender', 'goalkeeper']

    const topPlayers = positions.map(pos => {
        const playersInPos = playersList.filter(p => p.player_position === pos)
        if (playersInPos.length === 0) return null

        return playersInPos.reduce((prev, current) => {
            const prevScore = prev.peer_rating_score ?? 0
            const currentScore = current.peer_rating_score ?? 0
            return (prevScore > currentScore) ? prev : current
        })
    })
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .sort((a, b) => (b.peer_rating_score ?? 0) - (a.peer_rating_score ?? 0))

    const sortedMatches = [...(matches ?? [])].sort((a, b) => {
        const priority: Record<string, number> = { open: 1, completed: 3 }
        const pA = priority[a.status] || 2
        const pB = priority[b.status] || 2
        if (pA !== pB) return pA - pB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }).slice(0, 3)

    const effectiveScore = profile
        ? profile.base_score + profile.goals * 2
        : 0

    const canRate = profile?.is_admin || profile?.is_king || profile?.is_player || profile?.is_manager

    return (
        <div className="dashboard-page flex min-w-0 flex-col gap-6 overflow-hidden lg:gap-8">
            {/* Page header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Squad overview</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">
                        Good to see you, {profile?.first_name ?? 'Player'}.
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
                        Keep an eye on your performance, upcoming games, and everything happening across your squad.
                    </p>
                </div>
                <Link
                    href="/matches"
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent/40 hover:text-accent"
                >
                    Browse matches
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>

            {/* Ratings Notice */}
            {canRate && (
                <Link href="/ratings" className="block w-full">
                    <div className="group flex flex-col gap-4 rounded-xl border border-accent/25 bg-accent/[0.08] p-4 transition-colors hover:border-accent/45 hover:bg-accent/[0.12] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557L3.04 10.942a.562.562 0 01.321-.988l5.518-.442a.562.562 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-accent sm:text-base">Ratings are open</h3>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-accent/80">
                                    Rate your teammates to keep scores fair and help everyone see where they stand.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-accent/20 pt-3 sm:border-0 sm:pt-0">
                            <span className="text-xs font-medium text-accent/70 sm:hidden">Action needed</span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-accent">
                                Open ratings <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                            </span>
                        </div>
                    </div>
                </Link>
            )}

            {/* Stat cards */}
            <section aria-label="Your performance" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                    label="Your Score"
                    value={effectiveScore}
                    valueGradient="from-emerald-800 to-emerald-950 dark:from-emerald-500 dark:to-emerald-700"
                    animated
                    icon={
                        <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>
                    }
                    className="min-h-[132px] p-4 sm:p-5"
                />
                <StatCard
                    label="Peer Rating"
                    value={profile?.peer_rating_score ?? '-'}
                    valueGradient="from-amber-700 to-amber-900 dark:from-amber-500 dark:to-amber-700"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                    }
                    className="min-h-[132px] p-4 sm:p-5"
                />

                {/* <StatCard
                    label="Goals"
                    value={profile?.goals ?? 0}
                    valueGradient="from-amber-700 to-amber-900 dark:from-amber-500 dark:to-amber-700"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2v4l3.5 2.5L20 7M12 2l-3.5 6.5L12 12l3.5-3.5M12 12l-3.5-3.5L4 7l4.5 1.5M12 12l-4.5 3L4 17l4.5-2M12 12l4.5 3L20 17l-4.5-2M12 12v5l-3.5 3M12 17l3.5 3" />
                        </svg>
                    }
                /> */}
                <StatCard
                    label="Matches Played"
                    value={profile?.matches_played ?? 0}

                    valueGradient="from-emerald-800 to-emerald-950 dark:from-emerald-500 dark:to-emerald-700"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    }
                    className="min-h-[132px] p-4 sm:p-5"
                />
                <StatCard
                    label="Base Score"
                    value={profile?.base_score ?? 50}
                    valueGradient="from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-600"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="1em" height="1em"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                    }
                    className="min-h-[132px] p-4 sm:p-5"
                />
            </section>

            <section aria-labelledby="activity-heading" className="min-w-0">
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Stay in the loop</p>
                        <h2 id="activity-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-text-primary">Your squad at a glance</h2>
                    </div>
                    <span className="hidden text-xs text-text-muted sm:block">Updated from your latest activity</span>
                </div>

                {/* 2-column grid on md+ */}
                <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                    <UpcomingMatches
                        matches={sortedMatches}
                        isAdmin={profile?.is_admin || profile?.is_king || false}
                    />

                    <OngoingAuctions
                        auctions={auctions}
                    />

                    <Card padding="none" className="min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Leaderboard</p>
                                <h2 className="mt-1 font-semibold text-text-primary">Top players</h2>
                            </div>
                            <Link href="/players" className="text-xs font-medium text-accent transition-colors hover:text-accent-hover">View all →</Link>
                        </div>
                        <TopPlayersList players={topPlayers} />
                    </Card>
                </div>
            </section>
        </div>
    )
}

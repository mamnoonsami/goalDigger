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

    const [
        { data: { user } },
        { data: player },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played, created_at, peer_rating_score')
            .eq('id', id)
            .single(),
    ])

    if (!player) notFound()

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin ?? false
    const effectiveScore = player.base_score + player.goals * 2
    const goalsPerMatch = player.matches_played > 0 ? (player.goals / player.matches_played).toFixed(2) : '0.00'

    return (
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/players" className="shrink-0 transition-colors hover:text-accent">Players</Link>
                <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="none"><path d="m7.5 4 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="min-w-0 truncate font-medium text-text-primary">{player.first_name} {player.last_name}</span>
            </div>

            <Card className="relative overflow-hidden p-0">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.18] via-accent/[0.03] to-transparent" />
                <div className="relative p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-3 sm:gap-6">
                        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Player profile</span>
                            <Badge variant={roleVariant[player.role] ?? 'slate'}>{player.role}</Badge>
                        </div>
                        <div className="shrink-0">
                            <PlayerDetailClient player={player} isAdmin={isAdmin} />
                        </div>
                    </div>

                    <div className="mt-5 flex items-center gap-4 sm:mt-6 sm:gap-5">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full ring-4 ring-accent/10 sm:h-24 sm:w-24">
                            <Avatar
                                firstName={player.first_name}
                                lastName={player.last_name}
                                avatarUrl={player.avatar_url}
                                size="xl"
                                className="!h-20 !w-20 sm:!h-24 sm:!w-24"
                                interactive={true}
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="break-words text-balance text-2xl font-semibold leading-tight tracking-[-0.04em] text-text-primary sm:text-3xl">
                                {player.first_name} {player.last_name}
                            </h1>
                            <p className="mt-1.5 text-sm font-medium capitalize text-text-muted">{player.player_position ?? 'No position set'}</p>
                            <p className="mt-1 text-xs text-text-muted">
                                Squad member since {new Date(player.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-accent/20 bg-accent/[0.08] p-4 sm:p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent/80">Peer rating</p>
                            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-accent sm:text-3xl">{player.peer_rating_score ?? '—'}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-surface-1/45 p-4 sm:p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Effective score</p>
                            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{effectiveScore}</p>
                        </div>
                        <div className="col-span-2 rounded-xl border border-border/70 bg-surface-1/45 p-4 sm:col-span-1 sm:p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Base score</p>
                            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{player.base_score}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:gap-6">
                <Card className="overflow-hidden p-0">
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Rating details</p>
                        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-text-primary">Score composition</h2>
                    </div>
                    <div className="p-5 sm:p-6">
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-text-primary">Base score</p>
                                    <p className="mt-0.5 text-xs text-text-muted">Starting performance value</p>
                                </div>
                                <span className="font-mono text-base font-semibold text-text-primary">{player.base_score}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
                                <div>
                                    <p className="font-medium text-text-primary">Goal contribution</p>
                                    <p className="mt-0.5 text-xs text-text-muted">{player.goals} goals × 2 points</p>
                                </div>
                                <span className="font-mono text-base font-semibold text-text-primary">+{player.goals * 2}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-xl border border-accent/20 bg-accent/[0.08] px-4 py-3.5">
                                <div>
                                    <p className="font-semibold text-text-primary">Effective score</p>
                                    <p className="mt-0.5 text-xs text-text-muted">Current calculated total</p>
                                </div>
                                <span className="font-mono text-xl font-bold text-accent">{effectiveScore}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="overflow-hidden p-0">
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Performance</p>
                        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-text-primary">Match output</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
                        <div className="rounded-xl border border-border/70 bg-surface-1/45 p-4">
                            <p className="text-xs font-medium text-text-muted">Goals</p>
                            <p className="mt-2 font-mono text-2xl font-bold text-text-primary">{player.goals}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-surface-1/45 p-4">
                            <p className="text-xs font-medium text-text-muted">Matches</p>
                            <p className="mt-2 font-mono text-2xl font-bold text-text-primary">{player.matches_played}</p>
                        </div>
                        <div className="col-span-2 rounded-xl border border-border/70 bg-surface-1/45 p-4">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-medium text-text-muted">Goals per match</p>
                                    <p className="mt-1 text-xs text-text-muted">Based on recorded appearances</p>
                                </div>
                                <p className="font-mono text-2xl font-bold text-accent">{goalsPerMatch}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

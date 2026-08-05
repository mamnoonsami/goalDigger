import { createClient } from '../../../../lib/supabase/server'
import { Card } from '../../../../components/ui/Card'
import { Badge, statusVariant } from '../../../../components/ui/Badge'
import { MatchActions } from '../../../../components/matches/MatchActions'
import { TeamRoster } from '../../../../components/matches/TeamRoster'
import { MatchAdminActions } from '../../../../components/matches/MatchAdminActions'
import { LocalTime } from '../../../../components/ui/LocalTime'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { MatchStatus } from '@goaldigger/core'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MatchDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Parallel data fetches
    const [
        { data: { user } },
        { data: match },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('matches').select('*').eq('id', id).single(),
    ])

    if (!match) notFound()

    // Fetch profile for admin check
    const { data: profile } = user
        ? await supabase.from('profiles').select('is_admin, is_king, tenant_id').eq('id', user.id).single()
        : { data: null }

    // Fetch signups with player profile data
    const { data: signups } = await supabase
        .from('match_signups')
        .select('player_id, team, invitation_accepted, paid, profiles(first_name, last_name, nickname, base_score, goals, peer_rating_score, player_position, avatar_url)')
        .eq('match_id', id)
        .order('signed_up_at', { ascending: true })
        .order('player_id', { ascending: true })

    // Fetch all players for admin management
    const { data: allPlayers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, base_score, peer_rating_score, player_position, avatar_url')
        .eq('tenant_id', profile?.tenant_id)
        .order('first_name', { ascending: true })

    const comingSignups = signups?.filter((s: any) => s.invitation_accepted) ?? []
    const notComingSignups = signups?.filter((s: any) => s.invitation_accepted === false) ?? []

    const hasJoined = comingSignups.some((s: { player_id: string }) => s.player_id === user!.id)
    const hasDeclined = notComingSignups.some((s: { player_id: string }) => s.player_id === user!.id)
    const isAdmin = profile?.is_admin || profile?.is_king || false

    return (
        <div className="flex flex-col gap-6 lg:gap-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/matches" className="transition-colors hover:text-accent">Matches</Link>
                <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none"><path d="m7.5 4 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="max-w-[55vw] truncate font-medium text-text-primary">{match.title}</span>
            </div>

            {/* Match Header */}
            <Card className="relative overflow-hidden p-0">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-accent/20 via-accent/[0.05] to-transparent" />
                <div className="relative p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4 sm:gap-6">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Match details</span>
                                <Badge variant={statusVariant[match.status as MatchStatus] ?? 'slate'}>{match.status}</Badge>
                            </div>
                            <div className="mt-3 flex items-start gap-3">
                                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent sm:flex">
                                    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2M12 10.4l3.7 2.7-1.4 4.2-4.3.1-2.1-3.9" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <h1 className="truncate text-2xl font-semibold tracking-[-0.035em] text-text-primary sm:text-3xl">{match.title}</h1>
                                    <p className="mt-2 text-sm text-text-muted">Everything you need before kickoff.</p>
                                </div>
                            </div>
                        </div>
                        {isAdmin && <MatchAdminActions match={match} />}
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-surface-1/45 p-3.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.2" /></svg></div>
                            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Location</p><p className="mt-1 truncate text-sm font-medium text-text-primary">{match.location ?? 'TBD'}</p></div>
                        </div>
                        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-surface-1/45 p-3.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></div>
                            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Date & time</p><p className="mt-1 truncate text-sm font-medium text-text-primary"><LocalTime isoString={match.scheduled_at} format="long" /></p></div>
                        </div>
                        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-surface-1/45 p-3.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0-1-5.8M17 14a4.5 4.5 0 0 1 3.5 4.4" /></svg></div>
                            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Players</p><p className="mt-1 text-sm font-medium text-text-primary">{comingSignups.length} <span className="font-normal text-text-muted">/ {match.max_players} signed up</span></p></div>
                        </div>
                    </div>

                    {match.notes && (
                        <div className="mt-3 rounded-xl border border-border/70 bg-surface-1/45 px-4 py-3 text-sm leading-6 text-text-muted">
                            <span className="mr-2 font-semibold text-text-primary">Notes</span>{match.notes}
                        </div>
                    )}

                    <div className="mt-6 border-t border-border pt-5">
                        <MatchActions
                            matchId={id}
                            matchStatus={match.status}
                            hasJoined={hasJoined}
                            hasDeclined={hasDeclined}
                        />
                    </div>
                </div>
            </Card>

            <section aria-labelledby="roster-heading">
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">The lineup</p>
                        <h2 id="roster-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-text-primary">Players & teams</h2>
                    </div>
                    <span className="hidden text-xs text-text-muted sm:block">{comingSignups.length} players confirmed</span>
                </div>
                <TeamRoster
                    key={comingSignups.map((s: { player_id: string }) => s.player_id).join(',') ?? 'empty'}
                    matchId={id}
                    scheduledAt={match.scheduled_at}
                    signups={comingSignups as any}
                    notComingSignups={notComingSignups as any}
                    allPlayers={allPlayers ?? []}
                    isAdmin={isAdmin}
                />
            </section>
        </div>
    )
}

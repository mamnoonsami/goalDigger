import { createClient } from '../../lib/supabase/server'
import { Card } from '../../components/ui/Card'
import { TournamentStatusBadge } from '../../components/tournaments/TournamentStatusBadge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatTournamentDate(startDate: string, endDate: string | null) {
    const start = new Date(`${startDate}T00:00`)
    const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    if (endDate && endDate !== startDate) {
        const end = new Date(`${endDate}T00:00`)
        return `${startLabel} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    }

    return `${startLabel}, ${start.getFullYear()}`
}

export default async function TournamentsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()
        isAdmin = profile?.is_admin ?? false
    }

    // Fetch all tournaments
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, name, description, status, auction_id, start_date, end_date, location, created_at')
        .order('created_at', { ascending: false })

    const tournamentList = tournaments ?? []
    const activeCount = tournamentList.filter((tournament) => tournament.status === 'active').length
    const setupCount = tournamentList.filter((tournament) => tournament.status === 'draft' || tournament.status === 'auction').length

    return (
        <div className="flex min-w-0 flex-col gap-6 overflow-hidden lg:gap-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Tournament centre</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">Compete for the title.</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Follow every competition from team selection to the final standings.</p>
                </div>
                {isAdmin && (
                    <>
                        <Link
                            href="/tournaments/create"
                            className="hidden shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] sm:inline-flex"
                        >
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            Create tournament
                        </Link>
                        <Link
                            href="/tournaments/create"
                            aria-label="Create tournament"
                            className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition-all hover:scale-105 hover:bg-accent-hover active:scale-[0.98] sm:hidden"
                        >
                            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </Link>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-xl border border-border bg-surface-2 px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium text-text-muted">Total tournaments</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{tournamentList.length}</p>
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.08] px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium text-accent/80">Active now</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-accent">{activeCount}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-border bg-surface-2 px-4 py-4 sm:col-span-1 sm:px-5">
                    <p className="text-xs font-medium text-text-muted">Draft or auction</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{setupCount}</p>
                </div>
            </div>

            {tournamentList.length > 0 ? (
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tournamentList.map((tournament) => (
                        <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group min-w-0">
                            <Card hoverable className="relative h-full min-w-0 overflow-hidden p-0">
                                <div className="h-1 bg-gradient-to-r from-accent to-accent/20" />
                                <div className="flex h-[calc(100%-0.25rem)] flex-col p-5 sm:p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Competition</p>
                                            <h2 className="mt-2 text-balance font-semibold leading-snug tracking-tight text-text-primary transition-colors group-hover:text-accent">{tournament.name}</h2>
                                        </div>
                                        <div className="shrink-0">
                                            <TournamentStatusBadge status={tournament.status} />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 bg-surface-1/50 p-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8v3a4 4 0 0 1-8 0V3Z" /><path d="M8 5H4v1a4 4 0 0 0 4 4M16 5h4v1a4 4 0 0 1-4 4M12 10v5M9 21h6M10 15h4v3h-4z" /></svg>
                                        </div>
                                        <div className="min-w-0 text-sm">
                                            <p className="truncate font-medium text-text-primary">
                                                {tournament.start_date ? formatTournamentDate(tournament.start_date, tournament.end_date) : 'Dates to be announced'}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-text-muted">{tournament.location ?? 'Location TBD'}</p>
                                        </div>
                                    </div>

                                    {tournament.description && (
                                        <p className="mt-4 line-clamp-2 text-xs leading-5 text-text-muted">{tournament.description}</p>
                                    )}

                                    <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-text-muted">
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            {tournament.auction_id ? (
                                                <>
                                                    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 5 5 5M12.5 6.5l5 5M4 20l7-7M3 21h6M9 4l7 7-5 5-7-7 5-5Z" /></svg>
                                                    <span className="truncate">Auction linked</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8v3a4 4 0 0 1-8 0V3ZM12 10v5M9 21h6M10 15h4v3h-4z" /></svg>
                                                    <span className="truncate">Tournament event</span>
                                                </>
                                            )}
                                        </span>
                                        <span className="shrink-0 font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">View details →</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8v3a4 4 0 0 1-8 0V3Z" /><path d="M8 5H4v1a4 4 0 0 0 4 4M16 5h4v1a4 4 0 0 1-4 4M12 10v5M9 21h6M10 15h4v3h-4z" /></svg>
                        </div>
                        <p className="mt-4 font-medium text-text-primary">No tournaments created yet</p>
                        <p className="mt-1 text-sm text-text-muted">{isAdmin ? 'Create the first competition to get started.' : 'New competitions will appear here when they are created.'}</p>
                    </div>
                </Card>
            )}
        </div>
    )
}

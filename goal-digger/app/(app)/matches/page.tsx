import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Badge, statusVariant } from '../../../components/ui/Badge'
import { LocalTime } from '../../../components/ui/LocalTime'
import Link from 'next/link'

export default async function MatchesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin || profile?.is_king || false

    const { data: queriedMatches } = await supabase
        .from('matches')
        .select('id, title, status, scheduled_at, location, max_players, created_at')
        .order('created_at', { ascending: false })

    const matches = [...(queriedMatches ?? [])].sort((a, b) => {
        const priority: Record<string, number> = { open: 1, completed: 3 }
        const pA = priority[a.status] || 2
        const pB = priority[b.status] || 2
        if (pA !== pB) return pA - pB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const openCount = matches.filter((match) => match.status === 'open').length
    const activeCount = matches.filter((match) => match.status === 'in_progress' || match.status === 'balanced').length

    return (
        <div className="flex min-w-0 flex-col gap-6 overflow-hidden lg:gap-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Match centre</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">Find your next game.</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Browse the schedule, choose your next fixture, and keep your squad moving.</p>
                </div>
                {isAdmin && (
                    <>
                        <Link
                            href="/matches/create"
                            className="hidden shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] sm:inline-flex"
                        >
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            Create match
                        </Link>
                        <Link
                            href="/matches/create"
                            aria-label="Create match"
                            className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition-all hover:scale-105 hover:bg-accent-hover active:scale-[0.98] sm:hidden"
                        >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </Link>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-xl border border-border bg-surface-2 px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium text-text-muted">Total matches</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{matches.length}</p>
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.08] px-4 py-4 sm:px-5">
                    <p className="text-xs font-medium text-accent/80">Open for sign-up</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-accent">{openCount}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-border bg-surface-2 px-4 py-4 sm:col-span-1 sm:px-5">
                    <p className="text-xs font-medium text-text-muted">In play or balanced</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{activeCount}</p>
                </div>
            </div>

            {matches.length > 0 ? (
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {matches.map((m) => (
                        <Link key={m.id} href={`/matches/${m.id}`} className="group min-w-0">
                            <Card hoverable className="relative h-full min-w-0 overflow-hidden p-0">
                                <div className="h-1 bg-gradient-to-r from-accent to-accent/20" />
                                <div className="p-5 sm:p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Fixture</p>
                                            <h2 className="mt-2 truncate font-semibold tracking-tight text-text-primary transition-colors group-hover:text-accent">{m.title}</h2>
                                        </div>
                                        <Badge variant={statusVariant[m.status] ?? 'slate'}>{m.status}</Badge>
                                    </div>

                                    <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 bg-surface-1/50 p-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2M12 10.4l3.7 2.7-1.4 4.2-4.3.1-2.1-3.9" /></svg>
                                        </div>
                                        <div className="min-w-0 text-sm">
                                            <p className="truncate font-medium text-text-primary"><LocalTime isoString={m.scheduled_at} format="long" /></p>
                                            <p className="mt-0.5 truncate text-xs text-text-muted">{m.location ?? 'Location TBD'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between text-xs text-text-muted">
                                        <span className="flex items-center gap-1.5"><svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0-1-5.8M17 14a4.5 4.5 0 0 1 3.5 4.4" /></svg> Up to {m.max_players} players</span>
                                        <span className="font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">View details →</span>
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
                            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2" /></svg>
                        </div>
                        <p className="mt-4 font-medium text-text-primary">No matches scheduled yet</p>
                        <p className="mt-1 text-sm text-text-muted">New fixtures will appear here when they are created.</p>
                    </div>
                </Card>
            )}
        </div>
    )
}

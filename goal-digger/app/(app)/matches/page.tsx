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
        .select('id, title, status, scheduled_at, location, max_players')
        .order('scheduled_at', { ascending: true })

    const matches = [...(queriedMatches ?? [])].sort((a, b) => {
        const priority: Record<string, number> = { open: 1, completed: 3 }
        const pA = priority[a.status] || 2
        const pB = priority[b.status] || 2
        if (pA !== pB) return pA - pB
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Matches</h1>
                    <p className="mt-1 text-sm text-text-muted">Browse and sign up for upcoming games.</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/matches/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98]"
                    >
                        <span>+</span> Create Match
                    </Link>
                )}
            </div>

            {matches && matches.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {matches.map((m) => (
                        <Link key={m.id} href={`/matches/${m.id}`}>
                            <Card hoverable>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <h2 className="font-semibold text-text-primary">{m.title}</h2>
                                    <Badge variant={statusVariant[m.status] ?? 'slate'}>{m.status}</Badge>
                                </div>
                                <div className="flex flex-col gap-1 text-sm text-text-muted">
                                    <span>📍 {m.location ?? 'TBD'}</span>
                                    <span>📅 <LocalTime isoString={m.scheduled_at} format="long" /></span>
                                    <span>👥 Max {m.max_players} players</span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card>
                    <p className="py-10 text-center text-sm text-text-muted">No matches scheduled yet.</p>
                </Card>
            )}
        </div>
    )
}

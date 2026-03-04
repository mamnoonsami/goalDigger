import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { TournamentStatusBadge } from '../../../components/tournaments/TournamentStatusBadge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Check if admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin ?? false

    // Fetch all tournaments
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, name, description, status, auction_id, start_date, end_date, location, created_at')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Tournaments</h1>
                    <p className="mt-1 text-sm text-text-muted">Competitive tournament events and standings.</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/tournaments/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98]"
                    >
                        <span>+</span> Create Tournament
                    </Link>
                )}
            </div>

            {tournaments && tournaments.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tournaments.map((t) => (
                        <Link key={t.id} href={`/tournaments/${t.id}`}>
                            <Card hoverable>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <h2 className="font-semibold text-text-primary">{t.name}</h2>
                                    <TournamentStatusBadge status={t.status} />
                                </div>
                                <div className="flex flex-col gap-1 text-sm text-text-muted">
                                    {t.start_date && (
                                        <span>📅 {new Date(t.start_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{t.end_date && t.end_date !== t.start_date ? ` – ${new Date(t.end_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : `, ${new Date(t.start_date + 'T00:00').getFullYear()}`}</span>
                                    )}
                                    {t.location && (
                                        <span>📍 {t.location}</span>
                                    )}
                                    {t.auction_id && (
                                        <span>🔗 Linked to auction</span>
                                    )}
                                    {t.description && (
                                        <span className="mt-1 line-clamp-2 text-xs">{t.description}</span>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card>
                    <p className="py-10 text-center text-sm text-text-muted">
                        No tournaments created yet.
                        {isAdmin && ' Click "Create Tournament" to get started.'}
                    </p>
                </Card>
            )}
        </div>
    )
}

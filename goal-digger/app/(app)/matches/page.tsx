import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Badge, statusVariant } from '../../../components/ui/Badge'

export default async function MatchesPage() {
    const supabase = await createClient()
    const { data: matches } = await supabase
        .from('matches')
        .select('id, title, status, scheduled_at, location, max_players')
        .order('scheduled_at', { ascending: true })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Matches</h1>
                    <p className="mt-1 text-sm text-text-muted">Browse and sign up for upcoming games.</p>
                </div>
            </div>

            {matches && matches.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {matches.map((m) => (
                        <Card key={m.id} hoverable>
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <h2 className="font-semibold text-text-primary">{m.title}</h2>
                                <Badge variant={statusVariant[m.status] ?? 'slate'}>{m.status}</Badge>
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-text-muted">
                                <span>📍 {m.location ?? 'TBD'}</span>
                                <span>📅 {new Date(m.scheduled_at).toLocaleString()}</span>
                                <span>👥 Max {m.max_players} players</span>
                            </div>
                        </Card>
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

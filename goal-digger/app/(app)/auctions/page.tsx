import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AuctionsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Check if admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin ?? false

    // Fetch all auctions with player count
    const { data: auctions } = await supabase
        .from('auctions')
        .select('id, title, description, scheduled_at, bid_timer_seconds, budget_per_manager, status, created_at')
        .order('scheduled_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Auctions</h1>
                    <p className="mt-1 text-sm text-text-muted">Player auction events for team building.</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/auctions/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98]"
                    >
                        <span>+</span> Create Auction
                    </Link>
                )}
            </div>

            {auctions && auctions.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {auctions.map((a) => {
                        const statusColors: Record<string, string> = {
                            draft: 'bg-surface-3 text-text-muted',
                            live: 'bg-emerald-500/15 text-emerald-400',
                            completed: 'bg-blue-500/15 text-blue-400',
                        }
                        return (
                            <Link key={a.id} href={`/auctions/${a.id}`}>
                                <Card hoverable>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h2 className="font-semibold text-text-primary">{a.title}</h2>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[a.status] ?? 'bg-surface-3 text-text-muted'}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm text-text-muted">
                                        <span>📅 {new Date(a.scheduled_at).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                        <span>⏱️ {a.bid_timer_seconds}s bid timer</span>
                                        <span>💰 {a.budget_per_manager} budget per manager</span>
                                        {a.description && (
                                            <span className="mt-1 line-clamp-2 text-xs">{a.description}</span>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <p className="py-10 text-center text-sm text-text-muted">
                        No auctions created yet.
                        {isAdmin && ' Click "Create Auction" to get started.'}
                    </p>
                </Card>
            )}
        </div>
    )
}

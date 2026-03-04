import { createClient } from '../../../../lib/supabase/server'
import { Card } from '../../../../components/ui/Card'
import { Badge, statusVariant } from '../../../../components/ui/Badge'
import { MatchActions } from '../../../../components/matches/MatchActions'
import { TeamRoster } from '../../../../components/matches/TeamRoster'
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
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single()

    // Fetch signups with player profile data
    const { data: signups } = await supabase
        .from('match_signups')
        .select('player_id, team, profiles(first_name, last_name, base_score, goals, player_position, avatar_url)')
        .eq('match_id', id)
        .order('signed_up_at', { ascending: true })

    const hasJoined = signups?.some((s: { player_id: string }) => s.player_id === user!.id) ?? false
    const isAdmin = profile?.is_admin ?? false

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/matches" className="hover:text-accent transition-colors">Matches</Link>
                <span>/</span>
                <span className="text-text-primary font-medium">{match.title}</span>
            </div>

            {/* Match Header */}
            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-2xl font-bold text-text-primary">{match.title}</h1>
                            <Badge variant={statusVariant[match.status as MatchStatus] ?? 'slate'}>
                                {match.status}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-text-muted">
                            <span>📍 {match.location ?? 'TBD'}</span>
                            <span>📅 {new Date(match.scheduled_at).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                            <span>👥 {signups?.length ?? 0} / {match.max_players} players</span>
                            {match.notes && <span className="sm:col-span-2">📝 {match.notes}</span>}
                        </div>
                    </div>
                </div>

                {/* Join / Leave buttons */}
                <div className="mt-5 pt-4 border-t border-border">
                    <MatchActions
                        matchId={id}
                        matchStatus={match.status}
                        hasJoined={hasJoined}
                    />
                </div>
            </Card>

            {/* Players & Team Management */}
            <TeamRoster
                key={signups?.map((s: { player_id: string }) => s.player_id).join(',') ?? 'empty'}
                matchId={id}
                signups={(signups ?? []) as any}
                isAdmin={isAdmin}
                matchStatus={match.status}
            />
        </div>
    )
}

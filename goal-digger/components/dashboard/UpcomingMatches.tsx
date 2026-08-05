'use client'

import Link from 'next/link'
import { Card } from '../ui/Card'
import { Badge, statusVariant } from '../ui/Badge'
import { LocalTime } from '../ui/LocalTime'
import type { MatchStatus } from '@goaldigger/core'

interface MatchSnippet {
    id: string
    title: string
    status: MatchStatus | string
    scheduled_at: string
    location: string | null
    max_players: number
    notes: string | null
}

interface UpcomingMatchesProps {
    matches: MatchSnippet[] | null
    isAdmin: boolean
}

export function UpcomingMatches({ matches }: UpcomingMatchesProps) {
    return (
        <>
            <Card padding="none">
                <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">On the calendar</p>
                        <h2 className="mt-1 font-semibold text-text-primary">Upcoming matches</h2>
                    </div>
                    <Link href="/matches" className="text-xs font-medium text-accent transition-colors hover:text-accent-hover">
                        View all →
                    </Link>
                </div>
                {matches && matches.length > 0 ? (
                    <ul className="divide-y divide-border">
                        {matches.map((m) => (
                            <li key={m.id} className="group relative flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5">
                                <div className="min-w-0">
                                    <Link href={`/matches/${m.id}`} className="block truncate text-sm font-medium text-text-primary transition-colors before:absolute before:inset-0 group-hover:text-accent">{m.title}</Link>
                                    <p className="mt-1 truncate text-xs text-text-muted">
                                        {m.location ?? 'TBD'} · <LocalTime isoString={m.scheduled_at} format="date-only" />
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <Badge variant={statusVariant[m.status as MatchStatus] ?? 'slate'}>
                                        {m.status}
                                    </Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="px-5 py-8 text-center text-sm text-text-muted">No upcoming matches.</p>
                )}
            </Card>
        </>
    )
}

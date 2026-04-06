'use client'

import { useState } from 'react'
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

export function UpcomingMatches({ matches, isAdmin }: UpcomingMatchesProps) {
    return (
        <>
            <Card padding="none">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="font-semibold text-text-primary">Upcoming Matches</h2>
                    <Link href="/matches" className="text-xs text-accent hover:underline">
                        View all →
                    </Link>
                </div>
                {matches && matches.length > 0 ? (
                    <ul className="divide-y divide-border">
                        {matches.map((m) => (
                            <li key={m.id} className="relative flex items-center justify-between gap-3 px-5 py-3.5 group hover:bg-surface-2 transition-colors cursor-pointer">
                                <div>
                                    <Link href={`/matches/${m.id}`} className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors before:absolute before:inset-0">{m.title}</Link>
                                    <p className="text-xs text-text-muted">
                                        {m.location ?? 'TBD'} · <LocalTime isoString={m.scheduled_at} format="date-only" />
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
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

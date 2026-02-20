'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '../ui/Card'
import { Badge, statusVariant } from '../ui/Badge'
import { MatchEditDialog } from '../../components/matches/MatchEditDialog'
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
    const [editingMatch, setEditingMatch] = useState<MatchSnippet | null>(null)

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
                            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5 group">
                                <div>
                                    <Link href={`/matches/${m.id}`} className="text-sm font-medium text-text-primary hover:text-accent transition-colors">{m.title}</Link>
                                    <p className="text-xs text-text-muted">
                                        {m.location ?? 'TBD'} · {new Date(m.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={statusVariant[m.status as MatchStatus] ?? 'slate'}>
                                        {m.status}
                                    </Badge>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setEditingMatch(m)}
                                            className="p-1 px-2 text-xs font-semibold text-accent border border-accent/20 rounded hover:bg-accent/10 transition-colors"
                                            title="Edit Match"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="px-5 py-8 text-center text-sm text-text-muted">No upcoming matches.</p>
                )}
            </Card>

            {editingMatch && (
                <MatchEditDialog
                    match={editingMatch}
                    isOpen={!!editingMatch}
                    onClose={() => setEditingMatch(null)}
                />
            )}
        </>
    )
}

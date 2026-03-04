'use client'

import Link from 'next/link'
import { Card } from '../ui/Card'
import { AuctionStatusBadge } from '../auctions/AuctionStatusBadge'

interface AuctionSnippet {
    id: string
    title: string
    status: string
    scheduled_at: string
}

interface OngoingAuctionsProps {
    auctions: AuctionSnippet[] | null
}

export function OngoingAuctions({ auctions }: OngoingAuctionsProps) {
    return (
        <Card padding="none">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-semibold text-text-primary">Auctions</h2>
                <Link href="/auctions" className="text-xs text-accent hover:underline">
                    View all →
                </Link>
            </div>
            {auctions && auctions.length > 0 ? (
                <ul className="divide-y divide-border">
                    {auctions.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5 group">
                            <div>
                                <Link href={`/auctions/${a.id}`} className="text-sm font-medium text-text-primary hover:text-accent transition-colors">{a.title}</Link>
                                <p className="text-xs text-text-muted">
                                    {new Date(a.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <AuctionStatusBadge status={a.status} scheduledAt={a.scheduled_at} />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="px-5 py-8 text-center text-sm text-text-muted">No auctions yet.</p>
            )}
        </Card>
    )
}

'use client'

import Link from 'next/link'
import { Card } from '../ui/Card'
import { AuctionStatusBadge } from '../auctions/AuctionStatusBadge'
import { LocalTime } from '../ui/LocalTime'

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
        <Card padding="none" className="min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Keep an eye on</p>
                    <h2 className="mt-1 font-semibold text-text-primary">Auctions</h2>
                </div>
                <Link href="/auctions" className="text-xs font-medium text-accent transition-colors hover:text-accent-hover">
                    View all →
                </Link>
            </div>
            {auctions && auctions.length > 0 ? (
                <ul className="divide-y divide-border">
                    {auctions.map((a) => (
                        <li key={a.id} className="group relative flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5">
                            <div className="min-w-0">
                                <Link href={`/auctions/${a.id}`} className="block truncate text-sm font-medium text-text-primary transition-colors before:absolute before:inset-0 group-hover:text-accent">{a.title}</Link>
                                <p className="mt-1 truncate text-xs text-text-muted">
                                    <LocalTime isoString={a.scheduled_at} format="long" />
                                </p>
                            </div>
                            <div className="shrink-0">
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

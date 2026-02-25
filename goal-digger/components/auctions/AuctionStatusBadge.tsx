'use client'

import { useState, useEffect } from 'react'
import { Badge } from './../ui/Badge'

interface AuctionStatusBadgeProps {
    status: string
    scheduledAt: string
}

export function AuctionStatusBadge({ status, scheduledAt }: AuctionStatusBadgeProps) {
    const [currentTime, setCurrentTime] = useState<number>(0)

    useEffect(() => {
        setCurrentTime(Date.now())
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000)
        return () => clearInterval(interval)
    }, [])

    // Only 'draft' auctions can dynamically become 'live'. 
    // Completed or cancelled auctions respect their explicit status.
    const isDynamicallyLive = status === 'draft' && currentTime > 0 && new Date(scheduledAt).getTime() <= currentTime
    const displayStatus = isDynamicallyLive ? 'live' : status

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-3  text-text-muted  border-border',
        live: 'bg-red-500/10  text-red-500   border-red-500/30',
        completed: 'bg-blue-500/15   text-blue-400   border-blue-500/20',
    }

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusColors[displayStatus] ?? 'bg-surface-3 text-text-muted border-border'}`}>
            {isDynamicallyLive ? (
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 border border-red-500/50 bg-red-500"></span>
                    </span>
                    <span>Live</span>
                </div>
            ) : (
                displayStatus
            )}
        </span>
    )
}

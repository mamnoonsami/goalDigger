'use client'

import { useEffect, useRef, useState } from 'react'

export interface LogEntry {
    id: string
    timestamp: Date
    message: string
    type: 'info' | 'success' | 'warning' | 'system'
}

interface AuctionLiveLogProps {
    entries: LogEntry[]
}

const typeColors: Record<LogEntry['type'], string> = {
    info: '#60a5fa',       // blue
    success: '#4ade80',    // green
    warning: '#facc15',    // yellow
    system: '#94a3b8',     // muted gray
}

const typeLabels: Record<LogEntry['type'], string> = {
    info: 'BID',
    success: 'SOLD',
    warning: 'UNSOLD',
    system: 'SYS',
}

export function AuctionLiveLog({ entries }: AuctionLiveLogProps) {
    const bodyRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [unseenCount, setUnseenCount] = useState(0)
    const prevCountRef = useRef(entries.length)

    // Auto-scroll WITHIN the log body only (not the page)
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        }
    }, [entries.length])

    // Track unseen entries when panel is closed
    useEffect(() => {
        if (!isOpen && entries.length > prevCountRef.current) {
            setUnseenCount(prev => prev + (entries.length - prevCountRef.current))
        }
        prevCountRef.current = entries.length
    }, [entries.length, isOpen])

    // Clear unseen count when panel opens
    useEffect(() => {
        if (isOpen) setUnseenCount(0)
    }, [isOpen])

    function formatTime(date: Date) {
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
    }

    return (
        <>
            {/* Floating toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="live-log-fab"
                title={isOpen ? 'Minimize Live Log' : 'Open Live Log'}
            >
                {isOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                )}
                {unseenCount > 0 && !isOpen && (
                    <span className="live-log-badge">{unseenCount > 9 ? '9+' : unseenCount}</span>
                )}
                <span className="live-log-fab-live">
                    <span className="live-log-fab-live-dot" />
                    LIVE
                </span>
            </button>

            {/* Floating panel */}
            {isOpen && (
                <div className="live-log-panel">
                    <div className="live-log-panel-header">
                        <div className="flex items-center gap-2">
                            <span className="auction-log-dot" />
                            <span className="text-sm font-semibold">Live Log</span>
                        </div>
                        <span className="text-[11px] text-text-muted">{entries.length} entries</span>
                    </div>

                    <div ref={bodyRef} className="auction-log-body live-log-panel-body">
                        {entries.length === 0 ? (
                            <div className="auction-log-empty">
                                Waiting for auction activity...
                                <span className="auction-log-cursor">▌</span>
                            </div>
                        ) : (
                            entries.map(entry => (
                                <div key={entry.id} className="auction-log-line">
                                    <span className="auction-log-time">{formatTime(entry.timestamp)}</span>
                                    <span
                                        className="auction-log-label"
                                        style={{ color: typeColors[entry.type] }}
                                    >
                                        [{typeLabels[entry.type]}]
                                    </span>
                                    <span className="auction-log-msg">{entry.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

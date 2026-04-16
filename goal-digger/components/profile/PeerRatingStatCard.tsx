'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'

export interface PeerRatingAnalytics {
    totalRatings: number
    globalAverage: number | null
    systemGlobalAverage?: number | null
    highestRating: number | null
    highestRatingPosition: string | null
    averagesByPosition: {
        striker: number | null
        midfielder: number | null
        defender: number | null
        goalkeeper: number | null
    }
}

interface PeerRatingStatCardProps {
    peerScore: number | string
    analytics: PeerRatingAnalytics
    valueGradient?: string
}

export function PeerRatingStatCard({ peerScore, analytics, valueGradient }: PeerRatingStatCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            {/* The actual Card Replacement */}
            <Card
                className="flex flex-col items-center text-center py-4 relative group cursor-pointer hover:border-accent/40 transition-all hover:bg-surface-2"
                onClick={() => setIsModalOpen(true)}
            >
                <span className={valueGradient ? `text-2xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${valueGradient}` : "text-2xl font-black text-accent font-mono"}>
                    {peerScore}
                </span>
                <span className="text-xs text-text-muted mt-1">Peer Rating</span>

                {/* Info Icon Button Context */}
                <button
                    className="absolute top-2 right-2 p-1 text-text-muted opacity-50 group-hover:opacity-100 group-hover:text-accent transition-all"
                    aria-label="View Detailed Analytics"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                </button>
            </Card>

            {/* Detailed Analytics Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-2 rounded-t-xl">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                                Rating Analytics
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-3 hover:text-text-primary transition-colors focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
                            {/* Explainer wrapper */}
                            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-xs text-accent">
                                <p className="font-semibold text-center">🔐 All ratings are 100% anonymous.</p>
                            </div>

                            {/* Global Highlights */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-surface-2 rounded-lg p-3 border border-border flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-black font-mono text-text-primary">
                                        {analytics.totalRatings}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider mt-1">Total Ratings</span>
                                </div>
                                <div className="bg-surface-2 rounded-lg p-3 border-l-2 border-l-accent flex flex-col items-center justify-center text-center shadow-lg shadow-accent/5">
                                    <span className="text-xl font-black font-mono text-accent">
                                        {peerScore}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-accent tracking-wider mt-1">My Score</span>
                                </div>
                                <div className="bg-surface-2 rounded-lg p-3 border border-border flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-black font-mono text-text-primary">
                                        {analytics.systemGlobalAverage ?? 'N/A'}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider mt-1">Global Avg</span>
                                </div>
                            </div>

                            {analytics.totalRatings > 0 ? (
                                <>
                                    {/* Breakdown by Pos */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary mb-3">Average rating given by position</h4>
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { label: 'Strikers', val: analytics.averagesByPosition.striker },
                                                { label: 'Midfielders', val: analytics.averagesByPosition.midfielder },
                                                { label: 'Defenders', val: analytics.averagesByPosition.defender },
                                                { label: 'Goalkeepers', val: analytics.averagesByPosition.goalkeeper }
                                            ].map(pos => (
                                                <div key={pos.label} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                                                    <span className="text-text-muted font-medium">{pos.label}</span>
                                                    <span className="font-mono font-bold text-text-primary">{pos.val ?? 'N/A'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>


                                </>
                            ) : (
                                <div className="py-8 text-center text-sm text-text-muted">
                                    Wait until players rate you to see detailed positional analytics here!
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

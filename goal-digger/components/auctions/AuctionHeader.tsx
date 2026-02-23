'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AuctionDetailActions } from './AuctionDetailActions'
import { joinAuction, leaveAuction } from '../../app/actions/auctions'

interface AuctionHeaderProps {
    auction: {
        id: string
        title: string
        status: string
        scheduled_at: string
        bid_timer_seconds: number
        budget_per_manager: number
        max_players_per_team: number
        description: string | null
    }
    isAdmin: boolean
    isManager?: boolean
    hasJoined?: boolean
    playerCount: number
}

export function AuctionHeader({ auction, isAdmin, isManager = false, hasJoined = false, playerCount }: AuctionHeaderProps) {
    const [isMinimized, setIsMinimized] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    async function handleJoin() {
        setIsProcessing(true)
        try {
            await joinAuction(auction.id)
        } catch (error) {
            console.error(error)
            alert('Failed to join auction')
        } finally {
            setIsProcessing(false)
        }
    }

    async function handleLeave() {
        setIsProcessing(true)
        try {
            await leaveAuction(auction.id)
        } catch (error) {
            console.error(error)
            alert('Failed to leave auction')
        } finally {
            setIsProcessing(false)
        }
    }

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-3 text-text-muted',
        live: 'bg-emerald-500/15 text-emerald-400',
        completed: 'bg-blue-500/15 text-blue-400',
    }

    return (
        <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1 rounded hover:bg-surface-3 text-text-muted transition-colors flex items-center justify-center flex-shrink-0"
                                title={isMinimized ? "Expand Details" : "Minimize Details"}
                            >
                                {isMinimized ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                )}
                            </button>
                            <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">{auction.title}</h1>
                            <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[auction.status] ?? 'bg-surface-3 text-text-muted'}`}>
                                {auction.status}
                            </span>
                        </div>

                        {/* Actions on top right */}
                        <div className="flex items-center gap-2">
                            {isManager && auction.status !== 'completed' && (
                                <>
                                    {hasJoined ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleLeave}
                                            disabled={isProcessing}
                                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                                        >
                                            {isProcessing ? 'Leaving...' : 'Leave'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleJoin}
                                            disabled={isProcessing}
                                            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0 h-8 px-4"
                                        >
                                            {isProcessing ? 'Joining...' : 'Join Auction'}
                                        </Button>
                                    )}
                                </>
                            )}

                            {isAdmin && auction.status === 'draft' && (
                                <AuctionDetailActions auctionId={auction.id} />
                            )}
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted pl-1 sm:pl-10">
                            <span className="flex items-center gap-1.5" suppressHydrationWarning>📅 {new Date(auction.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1.5">⏱️ {auction.bid_timer_seconds}s bid timer</span>
                            <span className="flex items-center gap-1.5">💰 {auction.budget_per_manager} max budget</span>
                            <span className="flex items-center gap-1.5">👥 {playerCount} / {auction.max_players_per_team} players per team</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Rules */}
            {!isMinimized && auction.description && (
                <div className="mt-4 text-sm text-text-muted pl-1 sm:pl-10 border-t border-border pt-4">
                    <p className="whitespace-pre-wrap"><span className="text-text-primary mr-1">📋</span>{auction.description}</p>
                </div>
            )}
        </Card>
    )
}

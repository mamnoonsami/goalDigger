'use client'

import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AuctionDetailActions } from './AuctionDetailActions'
import { EditAuctionDetailsModal } from './EditAuctionDetailsModal'
import { AuctionStatusBadge } from './AuctionStatusBadge'
import { joinAuction, leaveAuction } from '../../app/actions/auctions'
import { createClient } from '../../lib/supabase/client'
import { useToast } from '../providers/ToastProvider'

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
    linkedTournament?: { id: string; name: string } | null
}

export function AuctionHeader({ auction, isAdmin, isManager = false, hasJoined = false, playerCount, linkedTournament = null }: AuctionHeaderProps) {
    const [isMinimized, setIsMinimized] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const toast = useToast()

    // Track live auction details so statuses (like 'completed' or title changes) update instantly for everyone
    const [liveAuction, setLiveAuction] = useState(auction)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`auction_header_${auction.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'auctions',
                    filter: `id=eq.${auction.id}`
                },
                (payload) => {
                    const newRow = payload.new as any
                    setLiveAuction((current) => ({
                        ...current,
                        ...newRow
                    }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [auction.id])

    async function handleJoin() {
        setIsProcessing(true)
        try {
            await joinAuction(liveAuction.id)
            toast.success('Joined auction successfully')
        } catch (error) {
            console.error(error)
            toast.error('Failed to join auction')
        } finally {
            setIsProcessing(false)
        }
    }

    async function handleLeave() {
        setIsProcessing(true)
        try {
            await leaveAuction(liveAuction.id)
            toast.warning('Left the auction')
        } catch (error) {
            console.error(error)
            toast.error('Failed to leave auction')
        } finally {
            setIsProcessing(false)
        }
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
                            <div className="flex flex-col">
                                <h1 className="text-lg sm:text-2xl font-bold text-text-primary truncate">{liveAuction.title}</h1>
                            </div>
                            <div className="hidden sm:block">
                                <AuctionStatusBadge status={liveAuction.status} scheduledAt={liveAuction.scheduled_at} />
                            </div>
                        </div>

                        {/* Actions — desktop: inline buttons, mobile: 3-dot menu */}
                        {/* Desktop buttons */}
                        <div className="hidden sm:flex items-center gap-2">
                            {isManager && liveAuction.status !== 'completed' && (
                                <>
                                    {hasJoined ? (
                                        <Button variant="ghost" size="sm" onClick={handleLeave} disabled={isProcessing} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8">
                                            {isProcessing ? 'Leaving...' : 'Leave'}
                                        </Button>
                                    ) : (
                                        <Button variant="primary" size="sm" onClick={handleJoin} disabled={isProcessing} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0 h-8 px-4">
                                            {isProcessing ? 'Joining...' : 'Join Auction'}
                                        </Button>
                                    )}
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="text-accent hover:text-accent-hover hover:bg-accent/10" title="Edit Auction">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                                    </Button>
                                    <AuctionDetailActions auctionId={liveAuction.id} />
                                </>
                            )}
                        </div>

                        {/* Mobile 3-dot menu */}
                        {((isManager && liveAuction.status !== 'completed') || isAdmin) && (
                            <div className="relative sm:hidden">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="p-1.5 rounded-lg hover:bg-surface-3 text-text-muted transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                                </button>
                                {mobileMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-surface-2 shadow-xl py-1">
                                            {isManager && liveAuction.status !== 'completed' && (
                                                hasJoined ? (
                                                    <button onClick={() => { handleLeave(); setMobileMenuOpen(false) }} disabled={isProcessing} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-3 transition-colors">
                                                        Leave Auction
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { handleJoin(); setMobileMenuOpen(false) }} disabled={isProcessing} className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-surface-3 transition-colors">
                                                        Join Auction
                                                    </button>
                                                )
                                            )}
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => { setIsEditModalOpen(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-surface-3 transition-colors">
                                                        Edit Auction
                                                    </button>
                                                    <div className="border-t border-border my-1" />
                                                    <AuctionDetailActions auctionId={liveAuction.id} variant="menu" />
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {!isMinimized && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted pl-1 sm:pl-10">
                            <span className="flex items-center gap-1.5" suppressHydrationWarning>📅 {new Date(liveAuction.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1.5">⏱️ {liveAuction.bid_timer_seconds}s bid timer</span>
                            <span className="flex items-center gap-1.5">💰 {liveAuction.budget_per_manager} max budget</span>
                            <span className="flex items-center gap-1.5">👥 {playerCount} / {liveAuction.max_players_per_team} players per team</span>
                            {linkedTournament && (
                                <a href={`/tournaments/${linkedTournament.id}`} className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors">🏆 {linkedTournament.name}</a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Rules */}
            {!isMinimized && liveAuction.description && (
                <div className="mt-4 text-sm text-text-muted pl-1 sm:pl-10">
                    <p className="whitespace-pre-wrap"><span className="text-text-primary mr-1">📋</span>{liveAuction.description}</p>
                </div>
            )}

            {isEditModalOpen && (
                <EditAuctionDetailsModal
                    auction={{
                        id: liveAuction.id,
                        title: liveAuction.title,
                        status: liveAuction.status,
                        description: liveAuction.description || '',
                        scheduled_at: liveAuction.scheduled_at,
                        bid_timer_seconds: liveAuction.bid_timer_seconds,
                        budget_per_manager: liveAuction.budget_per_manager,
                        max_players_per_team: liveAuction.max_players_per_team
                    }}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </Card>
    )
}

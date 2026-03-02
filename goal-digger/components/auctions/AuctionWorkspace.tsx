'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Card } from '../ui/Card'
import { PlayerSpinWheel } from './PlayerSpinWheel'
import { AuctionPlayerList } from './AuctionPlayerList'
import { ManageAuctionPlayersModal } from './ManageAuctionPlayersModal'
import { ManageAuctionManagersModal } from './ManageAuctionManagersModal'
import { AuctionLiveLog } from './AuctionLiveLog'
import type { LogEntry } from './AuctionLiveLog'

interface AuctionWorkspaceProps {
    auctionId: string
    isAdmin: boolean
    auctionPlayers: any[]
    allDbPlayers?: any[]
    allDbManagers?: any[]
    managers: { row_id: string; id: string; first_name: string; last_name: string; avatar_url: string | null }[]
    budgetPerManager: number
    maxPlayersPerTeam: number
}

export function AuctionWorkspace({ auctionId, isAdmin, auctionPlayers, allDbPlayers = [], allDbManagers = [], managers, budgetPerManager, maxPlayersPerTeam }: AuctionWorkspaceProps) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
    const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false)
    const [isManageManagersOpen, setIsManageManagersOpen] = useState(false)

    // Store players in local state to allow realtime updates
    const [liveAuctionPlayers, setLiveAuctionPlayers] = useState(auctionPlayers)

    // Store managers in local state to allow realtime updates
    const [liveManagers, setLiveManagers] = useState(managers)

    // Store array of player IDs that were updated in the last 3 seconds
    const [recentlyUpdated, setRecentlyUpdated] = useState<string[]>([])

    // Ref to the broadcast channel so the spin wheel handler can send on it
    const eventsChannelRef = useRef<any>(null)

    // Live log entries (in-memory only — not persisted)
    const [logEntries, setLogEntries] = useState<LogEntry[]>([])

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        setLogEntries(prev => [...prev, {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date(),
            message,
            type,
        }])
    }, [])

    // Subscribe to realtime updates for this auction's players and managers
    useEffect(() => {
        const supabase = createClient()

        const playersChannel = supabase
            .channel(`auction_players_${auctionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'auction_players',
                    filter: `auction_id=eq.${auctionId}`
                },
                (payload) => {
                    const newRow = payload.new as any

                    // Track the visual animation state
                    setRecentlyUpdated((prev) => [...prev, newRow.player_id])
                    setTimeout(() => {
                        setRecentlyUpdated((prev) => prev.filter(id => id !== newRow.player_id))
                    }, 3000)

                    // Build log entry from the realtime event
                    const playerProfile = auctionPlayers.find(p => p.player_id === newRow.player_id)
                    const pData = playerProfile ? (Array.isArray(playerProfile.profiles) ? playerProfile.profiles[0] : playerProfile.profiles) : null
                    const playerName = pData ? `${pData.first_name} ${pData.last_name}` : 'Unknown'

                    if (newRow.status === 'sold') {
                        const mgr = managers.find(m => m.id === newRow.sold_to)
                        const mgrName = mgr ? `${mgr.first_name} ${mgr.last_name}` : 'a manager'
                        addLog('success', `${playerName} sold for $${newRow.sold_price} to ${mgrName}`)
                    } else if (newRow.status === 'unsold') {
                        addLog('warning', `${playerName} is unsold for now, will look back at it later`)
                    } else if (newRow.status === 'pending') {
                        addLog('system', `${playerName} has been reset to pending`)
                    }

                    // Update the actual data
                    setLiveAuctionPlayers((current) =>
                        current.map((player) =>
                            player.player_id === newRow.player_id
                                ? { ...player, status: newRow.status, sold_to: newRow.sold_to, sold_price: newRow.sold_price }
                                : player
                        )
                    )
                }
            )
            .subscribe()

        // Broadcast channel for custom events (e.g. player selected from spin wheel)
        const eventsChannel = supabase
            .channel(`auction_events_${auctionId}`)
            .on('broadcast', { event: 'player_selected' }, ({ payload }) => {
                // Only non-admin viewers use this — admin already adds the log locally
                if (!isAdmin && payload?.playerName) {
                    addLog('info', `${payload.playerName} is up for bidding`)
                }
            })
            .subscribe()

        eventsChannelRef.current = eventsChannel;

        const managersChannel = supabase
            .channel(`auction_managers_${auctionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'auction_managers',
                    filter: `auction_id=eq.${auctionId}`
                },
                (payload) => {
                    const newRow = payload.new as any

                    // Find the full manager profile from our pre-fetched db list based solely on the incoming manager_id
                    const fullProfile = allDbManagers.find(m => m.id === newRow.manager_id)
                    if (fullProfile) {
                        setLiveManagers(current => {
                            // avoid duplicates if already rendered
                            if (current.some(m => m.id === newRow.manager_id)) return current
                            return [...current, {
                                row_id: newRow.id,
                                id: fullProfile.id,
                                first_name: fullProfile.first_name,
                                last_name: fullProfile.last_name,
                                avatar_url: fullProfile.avatar_url
                            }]
                        })
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'auction_managers'
                    // Notice: intentionally omitting the `auction_id=eq` filter!
                    // Supabase DELETE payloads only contain the Primary Key if REPLICA_IDENTITY is default.
                    // Because `auction_id` is not the PK, it's missing from `payload.old` which causes the filter to drop the message.
                    // We must catch ALL DELETES globally and filter locally using `row_id === oldRow.id`.
                },
                (payload) => {
                    const oldRow = payload.old as any
                    if (oldRow && oldRow.id) {
                        setLiveManagers(current => current.filter(m => m.row_id !== oldRow.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(playersChannel)
            supabase.removeChannel(managersChannel)
            supabase.removeChannel(eventsChannel)
        }
    }, [auctionId, allDbManagers, auctionPlayers, managers, addLog])

    // System log on mount
    useEffect(() => {
        addLog('system', 'Connected to auction — live log started')
    }, [addLog])

    // Compute dynamic lists from the *live* state
    const pendingForSpin = liveAuctionPlayers
        .filter((p: any) => p.status === 'pending' || p.status === 'unsold')
        .map((p: any) => {
            const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            return {
                id: p.player_id,
                name: `${profileData?.first_name} ${profileData?.last_name}`,
                position: profileData?.player_position ?? null,
            };
        })

    const hasPending = isAdmin && pendingForSpin.length > 0
    const hasManagers = liveManagers.length > 0
    const numManagers = liveManagers.length

    let gridClass = "grid gap-3 w-full min-h-full "
    if (numManagers === 1) {
        gridClass += "grid-cols-1 grid-rows-1"
    } else if (numManagers === 2) {
        gridClass += "grid-cols-1 grid-rows-2"
    } else if (numManagers === 3) {
        gridClass += "grid-cols-1 grid-rows-3"
    } else {
        gridClass += "grid-cols-2 auto-rows-fr"
    }

    // Determine grid columns based on active panels
    let gridCols = "grid-cols-1 lg:grid-cols-2"
    if (hasPending && isAdmin && hasManagers) gridCols = "grid-cols-1 lg:grid-cols-[4fr_3fr_3fr]"
    else if (hasPending && isAdmin && !hasManagers) gridCols = "grid-cols-1 lg:grid-cols-2"

    return (
        <div className="flex flex-col gap-6 overflow-x-hidden">
            <div className={`grid ${gridCols} gap-6 items-stretch`}>
                {/* Spin Wheel — admin only */}
                {hasPending && isAdmin && (
                    <div className="flex flex-col h-full min-h-[400px] min-w-0 overflow-hidden">
                        <div className="h-full">
                            <PlayerSpinWheel
                                players={pendingForSpin}
                                onPlayerSelected={(player) => {
                                    setSelectedPlayerId(player.id)
                                    // Broadcast to all viewers via the subscribed channel
                                    eventsChannelRef.current?.send({
                                        type: 'broadcast',
                                        event: 'player_selected',
                                        payload: { playerName: player.name },
                                    })
                                    addLog('info', `${player.name} is up for bidding`)
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col h-full min-h-[400px] min-w-0">
                    {/* Player List */}
                    <Card className="h-full flex flex-col pt-4">
                        <div className="flex items-center justify-between mb-4 flex-none px-1">
                            <h2 className="text-lg font-semibold text-text-primary">Auction Players</h2>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsManagePlayersOpen(true)}
                                    className="text-xs font-medium text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded transition-colors"
                                >
                                    Manage Players
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <AuctionPlayerList
                                auctionId={auctionId}
                                isAdmin={isAdmin}
                                players={liveAuctionPlayers}
                                managers={liveManagers}
                                selectedPlayerId={selectedPlayerId}
                                recentlyUpdated={recentlyUpdated}
                                budgetPerManager={budgetPerManager}
                                maxPlayersPerTeam={maxPlayersPerTeam}
                            />
                        </div>
                    </Card>
                </div>

                {/* Manager Dashboard */}
                {hasManagers && (
                    <div className="flex flex-col h-full min-h-[400px] min-w-0">
                        <Card className="h-full flex flex-col pt-4">
                            <div className="flex items-center justify-between mb-4 flex-none px-1">
                                <h2 className="text-lg font-semibold text-text-primary">Manager Dashboard</h2>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsManageManagersOpen(true)}
                                        className="text-xs font-medium text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded transition-colors"
                                    >
                                        Manage Managers
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-x-hidden overflow-y-auto min-h-0 pr-2 pb-2">
                                <div className={gridClass}>
                                    {liveManagers.map((manager, idx) => {
                                        const isOdd = numManagers % 2 !== 0;
                                        const isLast = idx === numManagers - 1;
                                        const spanClass = (numManagers >= 5 && isOdd && isLast) ? "col-span-2" : "col-span-1";
                                        const boughtPlayers = liveAuctionPlayers.filter(p => p.status === 'sold' && p.sold_to === manager.id)
                                        const spent = boughtPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0)
                                        const remaining = budgetPerManager - spent

                                        const spotsLeft = Math.max(0, maxPlayersPerTeam - boughtPlayers.length)
                                        const availablePlayers = liveAuctionPlayers.filter(p => p.status === 'pending' || p.status === 'unsold')

                                        let minBasePrice = 0
                                        if (availablePlayers.length > 0) {
                                            minBasePrice = Math.min(...availablePlayers.map(p => p.base_price || 0))
                                        }

                                        const maxBid = spotsLeft > 0
                                            ? remaining - ((spotsLeft - 1) * minBasePrice)
                                            : 0

                                        const isCritical = remaining <= (budgetPerManager * 0.33)
                                        const isWarning = !isCritical && remaining <= (budgetPerManager * 0.50)

                                        let cardBorderClass = ""
                                        const hasRecentPurchase = boughtPlayers.some(p => recentlyUpdated.includes(p.player_id))

                                        if (hasRecentPurchase) {
                                            cardBorderClass = "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10 transition-colors duration-300"
                                        }

                                        return (
                                            <Card key={manager.id} className={`relative flex flex-col justify-center gap-1.5 p-2.5 h-full ${cardBorderClass} ${spanClass}`}>
                                                {(isCritical || isWarning) && (
                                                    <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-md z-10 ${isCritical
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        <span className="relative flex h-2 w-2">
                                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                        </span>
                                                        <span className="text-[9px] font-semibold tracking-wide uppercase">
                                                            {isCritical ? 'Low Balance' : 'Balance Warning'}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="h-7 w-7 min-w-[28px] rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs border-2 border-accent/30 overflow-hidden">
                                                        {manager.avatar_url ? (
                                                            <img src={manager.avatar_url} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            `${manager.first_name[0]}${manager.last_name[0]}`
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 pr-16 lg:pr-24">
                                                        <p className="text-xs font-semibold text-text-primary truncate">{manager.first_name} {manager.last_name}</p>
                                                        <p className="text-[9px] text-text-muted">{boughtPlayers.length} / {maxPlayersPerTeam} players</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mt-0.5 pt-1.5 border-t border-border">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-text-muted">Spent</span>
                                                        <span className="text-xs font-medium text-red-400">${spent}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-text-muted">Remaining</span>
                                                        <span className={`text-xs font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>${remaining}</span>
                                                        <span className={`text-[9px] mt-0.5 ${maxBid > 0 ? 'text-text-muted' : 'text-red-400'}`}>Max: ${maxBid}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {!hasManagers && isAdmin && (
                    <div className="flex flex-col h-full min-h-[400px]">
                        <Card className="h-full flex flex-col pt-4 items-center justify-center border-dashed border-2 border-border bg-surface-1/50">
                            <div className="text-center p-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 text-text-muted mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-text-primary mb-1">No Managers Yet</h3>
                                <p className="text-sm text-text-muted mb-4 max-w-[250px] mx-auto">Add managers to this auction to build out the team rosters.</p>
                                <button
                                    onClick={() => setIsManageManagersOpen(true)}
                                    className="text-sm font-medium text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg shadow-sm transition-colors mx-auto inline-flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    Add Managers
                                </button>
                            </div>
                        </Card>
                    </div>
                )}

                {isManagePlayersOpen && (
                    <ManageAuctionPlayersModal
                        auctionId={auctionId}
                        allPlayers={allDbPlayers}
                        initialAssignedIds={liveAuctionPlayers.map(p => p.player_id)}
                        soldPlayerIds={liveAuctionPlayers.filter(p => p.status === 'sold').map(p => p.player_id)}
                        onClose={() => setIsManagePlayersOpen(false)}
                    />
                )}

                {isManageManagersOpen && (
                    <ManageAuctionManagersModal
                        auctionId={auctionId}
                        allManagers={allDbManagers}
                        initialAssignedIds={liveManagers.map(m => m.id)}
                        onClose={() => setIsManageManagersOpen(false)}
                    />
                )}
            </div>

            {/* Floating Live Log widget — shown for both admin and viewers */}
            <AuctionLiveLog entries={logEntries} />
        </div>
    )
}

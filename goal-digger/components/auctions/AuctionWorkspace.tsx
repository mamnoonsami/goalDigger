'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { PlayerSpinWheel } from './PlayerSpinWheel'
import { AuctionPlayerList } from './AuctionPlayerList'
import { ManageAuctionPlayersModal } from './ManageAuctionPlayersModal'
import { ManageAuctionManagersModal } from './ManageAuctionManagersModal'

interface AuctionWorkspaceProps {
    auctionId: string
    isAdmin: boolean
    pendingForSpin: any[]
    auctionPlayers: any[]
    allDbPlayers?: any[]
    allDbManagers?: any[]
    managers: { id: string; first_name: string; last_name: string; avatar_url: string | null }[]
    budgetPerManager: number
    maxPlayersPerTeam: number
}

export function AuctionWorkspace({ auctionId, isAdmin, pendingForSpin, auctionPlayers, allDbPlayers = [], allDbManagers = [], managers, budgetPerManager, maxPlayersPerTeam }: AuctionWorkspaceProps) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
    const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false)
    const [isManageManagersOpen, setIsManageManagersOpen] = useState(false)

    const hasPending = isAdmin && pendingForSpin.length > 0
    const hasManagers = managers.length > 0
    const numManagers = managers.length

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
    if (hasPending && hasManagers) gridCols = "grid-cols-1 lg:grid-cols-[4fr_3fr_3fr]" // 40% Spin Wheel, 30% Player List, 30% Dashboard
    else if (!hasPending && hasManagers) gridCols = "grid-cols-1 lg:grid-cols-2" // Player List + Dashboard
    else if (hasPending && !hasManagers) gridCols = "grid-cols-1 lg:grid-cols-2" // Spin Wheel + Player List

    return (
        <div className={`grid ${gridCols} gap-6 items-stretch`}>
            {hasPending && (
                <div className="flex flex-col h-full min-h-[400px]">
                    <div className="h-full">
                        <PlayerSpinWheel
                            players={pendingForSpin}
                            onPlayerSelected={(player) => setSelectedPlayerId(player.id)}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col h-full min-h-[400px]">
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
                            players={auctionPlayers}
                            managers={managers}
                            selectedPlayerId={selectedPlayerId}
                        />
                    </div>
                </Card>
            </div>

            {/* Manager Dashboard */}
            {hasManagers && (
                <div className="flex flex-col h-full min-h-[400px]">
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
                                {managers.map((manager, idx) => {
                                    const isOdd = numManagers % 2 !== 0;
                                    const isLast = idx === numManagers - 1;
                                    const spanClass = (numManagers >= 5 && isOdd && isLast) ? "col-span-2" : "col-span-1";
                                    const boughtPlayers = auctionPlayers.filter(p => p.status === 'sold' && p.sold_to === manager.id)
                                    const spent = boughtPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0)
                                    const remaining = budgetPerManager - spent

                                    // Max Bid Logic
                                    const spotsLeft = Math.max(0, maxPlayersPerTeam - boughtPlayers.length)

                                    // Find the lowest base price among remaining available players
                                    const availablePlayers = auctionPlayers.filter(p => p.status === 'pending' || p.status === 'unsold')

                                    // Calculate minimum base price needed to reserve
                                    let minBasePrice = 0
                                    if (availablePlayers.length > 0) {
                                        minBasePrice = Math.min(...availablePlayers.map(p => p.base_price || 0))
                                    }

                                    // To bid on *this* player, they must reserve enough for the *other* (spotsLeft - 1) slots
                                    const maxBid = spotsLeft > 0
                                        ? remaining - ((spotsLeft - 1) * minBasePrice)
                                        : 0

                                    // Warning styling
                                    const isCritical = remaining <= (budgetPerManager * 0.33)
                                    const isWarning = !isCritical && remaining <= (budgetPerManager * 0.50)

                                    let cardBorderClass = ""
                                    if (isCritical) {
                                        cardBorderClass = "ring-2 ring-red-500 transition-shadow animate-[pulse_1.5s_ease-in-out_infinite]"
                                    } else if (isWarning) {
                                        cardBorderClass = "ring-2 ring-yellow-500 transition-shadow animate-[pulse_1.5s_ease-in-out_infinite]"
                                    }

                                    return (
                                        <Card key={manager.id} className={`flex flex-col justify-center gap-1.5 p-2.5 h-full ${cardBorderClass} ${spanClass}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 min-w-[28px] rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs border-2 border-accent/30 overflow-hidden">
                                                    {manager.avatar_url ? (
                                                        <img src={manager.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        `${manager.first_name[0]}${manager.last_name[0]}`
                                                    )}
                                                </div>
                                                <div className="min-w-0">
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
                                                    <span className="text-xs font-bold text-emerald-400">${remaining}</span>
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

            {/* If there are no managers yet, we still need a way to add them, show an empty state dashboard */}
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
                    initialAssignedIds={auctionPlayers.map(p => p.player_id)}
                    soldPlayerIds={auctionPlayers.filter(p => p.status === 'sold').map(p => p.player_id)}
                    onClose={() => setIsManagePlayersOpen(false)}
                />
            )}

            {isManageManagersOpen && (
                <ManageAuctionManagersModal
                    auctionId={auctionId}
                    allManagers={allDbManagers}
                    initialAssignedIds={managers.map(m => m.id)}
                    onClose={() => setIsManageManagersOpen(false)}
                />
            )}
        </div>
    )
}

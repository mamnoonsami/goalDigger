'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { PlayerSpinWheel } from './PlayerSpinWheel'
import { AuctionPlayerList } from './AuctionPlayerList'

interface AuctionWorkspaceProps {
    auctionId: string
    isAdmin: boolean
    pendingForSpin: any[]
    auctionPlayers: any[]
    managers: { id: string; first_name: string; last_name: string; avatar_url: string | null }[]
    budgetPerManager: number
    maxPlayersPerTeam: number
}

export function AuctionWorkspace({ auctionId, isAdmin, pendingForSpin, auctionPlayers, managers, budgetPerManager, maxPlayersPerTeam }: AuctionWorkspaceProps) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

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
                <Card className="h-full flex flex-col">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex-none">Auction Players</h2>
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
                    <Card className="h-full flex flex-col">
                        <h2 className="text-lg font-semibold text-text-primary mb-4 flex-none">Manager Dashboard</h2>
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
        </div>
    )
}

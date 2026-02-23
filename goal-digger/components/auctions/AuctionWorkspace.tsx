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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col h-full min-h-[400px]">
                {/* Spin Wheel — admin only, when pending players exist */}
                {isAdmin && pendingForSpin.length > 0 ? (
                    <div className="h-full">
                        <PlayerSpinWheel
                            players={pendingForSpin}
                            onPlayerSelected={(player) => setSelectedPlayerId(player.id)}
                        />
                    </div>
                ) : (
                    <div className="hidden lg:block h-full"></div>
                )}
            </div>

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
            {managers.length > 0 && (
                <div className="col-span-1 lg:col-span-2 mt-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Manager Dashboard</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {managers.map(manager => {
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
                                <Card key={manager.id} className={`flex flex-col gap-3 ${cardBorderClass}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 min-w-[40px] rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm border-2 border-accent/30 overflow-hidden">
                                            {manager.avatar_url ? (
                                                <img src={manager.avatar_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                `${manager.first_name[0]}${manager.last_name[0]}`
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate">{manager.first_name} {manager.last_name}</p>
                                            <p className="text-xs text-text-muted">{boughtPlayers.length} / {maxPlayersPerTeam} players</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-text-muted">Spent</span>
                                            <span className="text-sm font-medium text-red-400">${spent}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-text-muted">Remaining</span>
                                            <span className="text-sm font-bold text-emerald-400">${remaining}</span>
                                            <span className={`text-[10px] mt-0.5 ${maxBid > 0 ? 'text-text-muted' : 'text-red-400'}`}>Max Bid: ${maxBid}</span>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

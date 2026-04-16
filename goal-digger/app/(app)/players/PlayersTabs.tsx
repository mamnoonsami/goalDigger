'use client'

import { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import Link from 'next/link'

type Player = {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    role: string
    player_position: string | null
    base_score: number
    goals: number
    matches_played: number
}

const POSITIONS = ['striker', 'midfielder', 'defender', 'goalkeeper'] as const
type PositionTab = typeof POSITIONS[number]

export function PlayersTabs({ players }: { players: Player[] }) {
    const [activeTab, setActiveTab] = useState<PositionTab>('striker')

    // Filter players by active tab (already sorted by parent)
    const filteredPlayers = players.filter(p => p.player_position === activeTab)

    return (
        <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex flex-nowrap overflow-x-auto hide-scrollbar items-center gap-1.5 sm:gap-2 pb-1">
                {POSITIONS.map(pos => (
                    <button
                        key={pos}
                        onClick={() => setActiveTab(pos)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-sm font-semibold capitalize whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                            activeTab === pos
                                ? 'bg-accent text-white shadow-md'
                                : 'bg-surface-2 text-text-muted hover:text-text-primary hover:bg-surface-3 border border-border'
                        }`}
                    >
                        {pos}
                    </button>
                ))}
            </div>

            {/* List */}
            {filteredPlayers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-w-0">
                    {filteredPlayers.map((p, i) => {
                        const score = p.base_score + p.goals * 2
                        const rankColor = i < 3 ? 'text-yellow-600' : 'text-text-muted'
                        const borderColor = i < 3 ? 'ring-2 ring-yellow-600' : ''
                        return (
                            <Link key={p.id} href={`/players/${p.id}`}>
                                <Card className={`flex items-center gap-1.5 sm:gap-4 !p-2.5 sm:!p-5 hover:border-accent/40 transition-colors cursor-pointer ${i < 3 ? 'border-l-2 border-l-yellow-600' : ''}`}>
                                    <span className={`font-mono text-base sm:text-2xl font-black w-5 sm:w-8 shrink-0 text-center ${rankColor}`}>
                                        {i + 1}
                                    </span>
                                    <div className={`shrink-0 rounded-full ${borderColor}`}>
                                        <Avatar
                                            firstName={p.first_name}
                                            lastName={p.last_name}
                                            avatarUrl={p.avatar_url}
                                            size="sm"
                                            className="sm:!h-10 sm:!w-10"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-text-primary truncate text-sm sm:text-base">
                                            {p.first_name} {p.last_name}
                                        </p>
                                        <p className="text-[11px] sm:text-xs text-text-muted capitalize truncate">
                                            {p.player_position ?? 'Unknown'} · {p.goals}G · {p.matches_played}M
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                        <span className="font-mono text-sm sm:text-lg font-bold text-accent">{score}</span>
                                        <Badge variant="slate">{p.role}</Badge>
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <p className="py-10 text-center text-sm text-text-muted">No {activeTab}s found.</p>
                </Card>
            )}
        </div>
    )
}

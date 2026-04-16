'use client'

import { useState } from 'react'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { FifaPlayerCard, FifaPlayerStats } from '../players/FifaPlayerCard'

const posAbbr: Record<string, string> = {
    striker: 'STK',
    midfielder: 'MID',
    defender: 'DEF',
    goalkeeper: 'GK'
}

type Variant = 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'purple'

const posVariant: Record<string, Variant> = {
    striker: 'red',
    midfielder: 'amber',
    defender: 'blue',
    goalkeeper: 'green'
}

interface TopPlayersListProps {
    players: FifaPlayerStats[]
}

export function TopPlayersList({ players }: TopPlayersListProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<FifaPlayerStats | null>(null)

    if (!players || players.length === 0) {
        return <p className="px-5 py-8 text-center text-sm text-text-muted">No players yet.</p>
    }

    return (
        <>
            <ul className="divide-y divide-border">
                {players.map((p, i) => (
                    <li
                        key={p.id}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors cursor-pointer group"
                        onClick={() => setSelectedPlayer(p)}
                    >
                        <div className="w-10 flex-shrink-0 flex items-center justify-center">
                            <Avatar
                                firstName={p.first_name}
                                lastName={p.last_name}
                                avatarUrl={p.avatar_url}
                                size="sm"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                                {p.first_name} {p.last_name}
                            </p>
                            <p className="text-xs text-text-muted">{p.goals} goals</p>
                        </div>
                        <Badge variant={p.player_position ? posVariant[p.player_position] ?? 'slate' : 'slate'}>{p.player_position ? posAbbr[p.player_position] || 'PLY' : 'Unknown'}</Badge>
                        <span className="font-mono text-sm font-bold text-accent">
                            {p.base_score + p.goals * 2}
                        </span>
                    </li>
                ))}
            </ul>

            {/* Modal Overlay Render */}
            {selectedPlayer && (
                <FifaPlayerCard
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </>
    )
}

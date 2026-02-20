'use client'

import { useState } from 'react'
import { PlayerEditDialog } from './PlayerEditDialog'
import { Button } from '../ui/Button'

interface PlayerDetailClientProps {
    player: {
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
    isAdmin: boolean
}

export function PlayerDetailClient({ player, isAdmin }: PlayerDetailClientProps) {
    const [editing, setEditing] = useState(false)

    return (
        <>
            {isAdmin && (
                <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
                    ✏️ Edit Player
                </Button>
            )}

            {editing && (
                <PlayerEditDialog
                    player={player}
                    onClose={() => setEditing(false)}
                />
            )}
        </>
    )
}

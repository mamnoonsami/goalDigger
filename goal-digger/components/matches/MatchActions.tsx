'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { joinMatch, leaveMatch } from '../../app/actions/matches'

interface MatchActionsProps {
    matchId: string
    matchStatus: string
    hasJoined: boolean
}

export function MatchActions({ matchId, matchStatus, hasJoined }: MatchActionsProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isOpen = matchStatus === 'open'

    async function handleJoin() {
        setLoading(true)
        setError(null)
        try {
            await joinMatch(matchId)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to join')
        } finally {
            setLoading(false)
        }
    }

    async function handleLeave() {
        setLoading(true)
        setError(null)
        try {
            await leaveMatch(matchId)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to leave')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
                {isOpen && !hasJoined && (
                    <Button onClick={handleJoin} isLoading={loading} size="lg">
                        ⚽ Join Game
                    </Button>
                )}
                {isOpen && hasJoined && (
                    <Button onClick={handleLeave} isLoading={loading} variant="danger" size="lg">
                        Leave Game
                    </Button>
                )}
            </div>

            {error && (
                <p className="text-sm text-danger">{error}</p>
            )}
        </div>
    )
}

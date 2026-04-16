'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { joinMatch, declineMatch } from '../../app/actions/matches'

interface MatchActionsProps {
    matchId: string
    matchStatus: string
    hasJoined: boolean
    hasDeclined?: boolean
}

export function MatchActions({ matchId, matchStatus, hasJoined, hasDeclined = false }: MatchActionsProps) {
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

    async function handleDecline() {
        setLoading(true)
        setError(null)
        try {
            await declineMatch(matchId)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to decline')
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
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent bg-transparent px-4 py-2.5 rounded-lg border border-black shadow-inner dark:border-border">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        You already joined
                    </span>
                )}

                {isOpen && !hasDeclined && (
                    <Button onClick={handleDecline} isLoading={loading} variant="danger" size="lg">
                        Can't Make It
                    </Button>
                )}
                {isOpen && hasDeclined && (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-danger bg-transparent px-4 py-2.5 rounded-lg border border-black shadow-inner dark:border-border">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        You declined this match
                    </span>
                )}
            </div>

            {error && (
                <p className="text-sm text-danger">{error}</p>
            )}
        </div>
    )
}

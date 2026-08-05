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
        <div className="flex flex-col gap-3 w-full sm:w-auto">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                {isOpen && !hasJoined && (
                    <Button onClick={handleJoin} isLoading={loading} size="lg" className="w-full justify-center gap-2 px-2 text-xs sm:w-auto sm:px-6 sm:text-base">
                        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2M12 10.4l3.7 2.7-1.4 4.2-4.3.1-2.1-3.9" /></svg>
                        Join game
                    </Button>
                )}
                {isOpen && hasJoined && (
                    <span className="flex w-full sm:w-auto items-center justify-center text-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-accent bg-transparent px-2 sm:px-4 py-2.5 rounded-lg border border-black shadow-inner dark:border-border">
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        <span className="truncate sm:hidden">Joined</span>
                        <span className="hidden sm:inline">You already joined</span>
                    </span>
                )}

                {isOpen && !hasDeclined && (
                    <Button onClick={handleDecline} isLoading={loading} variant="danger" size="lg" className="w-full sm:w-auto justify-center text-xs sm:text-base px-2 sm:px-6">
                        Can&apos;t make it
                    </Button>
                )}
                {isOpen && hasDeclined && (
                    <span className="flex w-full sm:w-auto items-center justify-center text-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-danger bg-transparent px-2 sm:px-4 py-2.5 rounded-lg border border-black shadow-inner dark:border-border">
                        <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        <span className="truncate sm:hidden">Declined</span>
                        <span className="hidden sm:inline">You declined this match</span>
                    </span>
                )}
            </div>

            {error && (
                <p className="text-sm text-danger">{error}</p>
            )}
        </div>
    )
}

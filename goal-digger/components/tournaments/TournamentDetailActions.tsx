'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { deleteTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface TournamentDetailActionsProps {
    tournamentId: string
}

export function TournamentDetailActions({ tournamentId }: TournamentDetailActionsProps) {
    const router = useRouter()
    const toast = useToast()
    const [deleting, setDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteTournament(tournamentId)
            toast.success('Tournament deleted')
            router.push('/tournaments')
        } catch {
            toast.error('Failed to delete tournament')
            setDeleting(false)
            setShowConfirm(false)
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">Delete this tournament?</span>
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                    Cancel
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Delete Tournament">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            </Button>
        </div>
    )
}

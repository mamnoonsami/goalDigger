'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { deleteTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface TournamentDetailActionsProps {
    tournamentId: string
    /** 'icon' = icon button for desktop, 'menu' = text list item for mobile dropdown */
    variant?: 'icon' | 'menu'
}

export function TournamentDetailActions({ tournamentId, variant = 'icon' }: TournamentDetailActionsProps) {
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

    return (
        <>
            {variant === 'icon' ? (
                <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Delete Tournament">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                </Button>
            ) : (
                <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-3 transition-colors"
                >
                    Delete Tournament
                </button>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Delete Tournament</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to delete this tournament? This action cannot be undone.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

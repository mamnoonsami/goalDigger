'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { deleteAuction, resetAuctionPlayers } from '../../app/actions/auctions'
import { useToast } from '../providers/ToastProvider'

interface AuctionDetailActionsProps {
    auctionId: string
    /** 'icon' = icon buttons for desktop, 'menu' = text list items for mobile dropdown */
    variant?: 'icon' | 'menu'
}

export function AuctionDetailActions({ auctionId, variant = 'icon' }: AuctionDetailActionsProps) {
    const router = useRouter()
    const toast = useToast()
    const [deleting, setDeleting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteAuction(auctionId)
            toast.success('Auction deleted')
            router.push('/auctions')
        } catch {
            toast.error('Failed to delete auction')
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    async function handleReset() {
        setIsResetting(true)
        try {
            await resetAuctionPlayers(auctionId)
            toast.warning('Auction has been reset — all players are now pending')
            router.refresh()
            setShowResetConfirm(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to reset auction')
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <>
            {variant === 'icon' ? (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(true)} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" title="Start Over">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Delete Auction">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </Button>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-surface-3 transition-colors"
                    >
                        Reset Auction
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-3 transition-colors"
                    >
                        Delete Auction
                    </button>
                </>
            )}

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Reset Auction</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to start this auction over? All sold and unsold players will be reset to pending.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)} disabled={isResetting}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleReset} disabled={isResetting}>
                                {isResetting ? 'Resetting...' : 'Reset'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Delete Auction</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to delete this auction? This action cannot be undone.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
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

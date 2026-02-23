'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { deleteAuction, resetAuctionPlayers } from '../../app/actions/auctions'

interface AuctionDetailActionsProps {
    auctionId: string
}

export function AuctionDetailActions({ auctionId }: AuctionDetailActionsProps) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteAuction(auctionId)
            router.push('/auctions')
        } catch {
            setDeleting(false)
            setShowConfirm(false)
        }
    }

    async function handleReset() {
        if (confirm('Are you sure you want to start this auction over? All sold/unsold players will be reset to pending.')) {
            setIsResetting(true)
            try {
                await resetAuctionPlayers(auctionId)
            } catch (error) {
                console.error(error)
                alert('Failed to reset auction.')
            } finally {
                setIsResetting(false)
            }
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">Delete this auction?</span>
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
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isResetting} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" title="Start Over">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => alert('Edit feature coming soon')} title="Edit Auction" className="text-accent hover:text-accent-hover hover:bg-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Delete Auction">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            </Button>
        </div>
    )
}

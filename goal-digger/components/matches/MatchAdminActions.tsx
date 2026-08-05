'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { deleteMatch } from '../../app/actions/matches'
import { useToast } from '../providers/ToastProvider'
import { MatchEditDialog } from './MatchEditDialog'
import type { MatchStatus } from '@goaldigger/core'

interface MatchSnippet {
    id: string
    title: string
    status: MatchStatus | string
    scheduled_at: string
    location: string | null
    max_players: number
    notes: string | null
}

interface MatchAdminActionsProps {
    match: MatchSnippet
}

export function MatchAdminActions({ match }: MatchAdminActionsProps) {
    const router = useRouter()
    const toast = useToast()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteMatch(match.id)
            toast.success('Match deleted')
            router.push('/matches')
        } catch {
            toast.error('Failed to delete match')
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    return (
        <>
            <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)} className="text-accent hover:text-accent-hover hover:bg-accent/10" title="Edit Match">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Delete Match">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                </Button>
            </div>

            <div className="relative shrink-0 sm:hidden">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Open match actions"
                    aria-expanded={mobileMenuOpen}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-text-muted shadow-sm transition-colors hover:border-accent/40 hover:bg-surface-3 hover:text-text-primary"
                >
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                </button>
                {mobileMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                        <div className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right rounded-xl border border-border bg-surface-2 p-1.5 shadow-xl shadow-black/20">
                            <button onClick={() => { setIsEditOpen(true); setMobileMenuOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3">
                                <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" /><path d="m15 5 4 4" /></svg>
                                Edit Match
                            </button>
                            <button onClick={() => { setShowDeleteConfirm(true); setMobileMenuOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14H5V6M8 6V4h8v2M10 11v5M14 11v5" /></svg>
                                Delete Match
                            </button>
                        </div>
                    </>
                )}
            </div>

            {isEditOpen && (
                <MatchEditDialog
                    match={match}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                />
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Delete Match</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to delete this match? This action cannot be undone.
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

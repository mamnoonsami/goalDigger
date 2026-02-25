'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { updateAuctionDetails } from '../../app/actions/auctions'

interface AuctionDetailsInitial {
    id: string
    title: string
    description: string
    scheduled_at: string
    bid_timer_seconds: number
    budget_per_manager: number
    max_players_per_team: number
    status: string
}

interface EditAuctionDetailsModalProps {
    auction: AuctionDetailsInitial
    onClose: () => void
}

export function EditAuctionDetailsModal({ auction, onClose }: EditAuctionDetailsModalProps) {
    const router = useRouter()

    const formatDate = (isoString?: string) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        const tzOffset = date.getTimezoneOffset() * 60000
        const localDate = new Date(date.getTime() - tzOffset)
        return localDate.toISOString().slice(0, 16)
    }

    const [title, setTitle] = useState(auction.title)
    const [description, setDescription] = useState(auction.description || '')
    const [scheduledAt, setScheduledAt] = useState(formatDate(auction.scheduled_at))
    const [bidTimer, setBidTimer] = useState(auction.bid_timer_seconds)
    const [budget, setBudget] = useState(auction.budget_per_manager)
    const [maxPlayers, setMaxPlayers] = useState(auction.max_players_per_team)
    const [status, setStatus] = useState(auction.status)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            await updateAuctionDetails(auction.id, {
                title,
                description,
                scheduled_at: new Date(scheduledAt).toISOString(),
                bid_timer_seconds: bidTimer,
                budget_per_manager: budget,
                max_players_per_team: maxPlayers,
                status,
            })
            router.refresh()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Edit Auction Details</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <form id="edit-details-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Title</span>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Date & Time</span>
                            <input type="datetime-local" required value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Bid Timer (s)</span>
                                <input type="number" required min={5} value={bidTimer} onChange={e => setBidTimer(Number(e.target.value))} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Budget</span>
                                <input type="number" required min={100} value={budget} onChange={e => setBudget(Number(e.target.value))} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Max Players per Team</span>
                                <input type="number" required min={1} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Status</span>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                                    <option value="draft">Draft</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </label>
                        </div>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Rules / Description</span>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent/40" />
                        </label>
                    </form>

                    {error && <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" form="edit-details-form" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { updateTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface TournamentInitial {
    id: string
    name: string
    description: string
    status: string
    auction_id: string | null
    start_date: string | null
    end_date: string | null
    location: string | null
}

interface Auction {
    id: string
    title: string
    status: string
}

interface EditTournamentModalProps {
    tournament: TournamentInitial
    auctions: Auction[]
    onClose: () => void
}

export function EditTournamentModal({ tournament, auctions, onClose }: EditTournamentModalProps) {
    const router = useRouter()
    const toast = useToast()

    const [name, setName] = useState(tournament.name)
    const [description, setDescription] = useState(tournament.description || '')
    const [status, setStatus] = useState(tournament.status)
    const [auctionId, setAuctionId] = useState(tournament.auction_id ?? '')
    const [startDate, setStartDate] = useState(tournament.start_date ?? '')
    const [endDate, setEndDate] = useState(tournament.end_date ?? '')
    const [location, setLocation] = useState(tournament.location ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            await updateTournament(tournament.id, {
                name,
                description,
                status,
                auction_id: auctionId || null,
                start_date: startDate || null,
                end_date: endDate || null,
                location,
            })
            router.refresh()
            toast.success('Tournament details updated')
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            toast.error('Failed to update tournament')
            setSaving(false)
        }
    }

    const inputClass = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Edit Tournament Details</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <form id="edit-tournament-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Tournament Name</span>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Status</span>
                                <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                                    <option value="draft">Draft</option>
                                    <option value="auction">Auction</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Linked Auction</span>
                                <select value={auctionId} onChange={e => setAuctionId(e.target.value)} className={inputClass}>
                                    <option value="">None</option>
                                    {auctions.map(a => (
                                        <option key={a.id} value={a.id}>{a.title} ({a.status})</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">Start Date</span>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-text-muted">End Date</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className={inputClass} />
                            </label>
                        </div>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Location</span>
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. City Stadium" className={inputClass} />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Description</span>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
                        </label>
                    </form>

                    {error && <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" form="edit-tournament-form" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

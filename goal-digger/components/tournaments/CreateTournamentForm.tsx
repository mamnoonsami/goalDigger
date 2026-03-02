'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { createTournament } from '../../app/actions/tournaments'

interface Auction {
    id: string
    title: string
    status: string
}

interface CreateTournamentFormProps {
    auctions: Auction[]
}

export function CreateTournamentForm({ auctions }: CreateTournamentFormProps) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('draft')
    const [auctionId, setAuctionId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [location, setLocation] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            setError('Tournament name is required')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const result = await createTournament({
                name: name.trim(),
                description: description.trim(),
                status,
                auction_id: auctionId || null,
                start_date: startDate || null,
                end_date: endDate || null,
                location: location.trim(),
            })
            router.push(`/tournaments`)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Tournament Details */}
            <div className="rounded-xl border border-border bg-surface-1 p-5">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Tournament Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-text-muted">Tournament Name</span>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Season 3 Tournament"
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">Status</span>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                            <option value="draft">Draft</option>
                            <option value="auction">Auction</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">Linked Auction <span className="text-text-muted/50 font-normal">(Optional)</span></span>
                        <select
                            value={auctionId}
                            onChange={(e) => setAuctionId(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                            <option value="">No linked auction</option>
                            {auctions.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.title} ({a.status})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">Start Date</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">End Date</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            min={startDate}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-text-muted">Location</span>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="e.g. City Stadium, Field 3"
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-text-muted">Description</span>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe the tournament rules and format..."
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                        />
                    </label>
                </div>
            </div>

            {/* Error + Submit */}
            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Tournament'}
                </Button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

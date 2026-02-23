'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { createAuction } from '../../app/actions/auctions'

interface Player {
    id: string
    first_name: string
    last_name: string
    player_position: string | null
    base_score: number
}

interface Manager {
    id: string
    first_name: string
    last_name: string
}

interface CreateAuctionFormProps {
    players: Player[]
    managers: Manager[]
}

export function CreateAuctionForm({ players, managers }: CreateAuctionFormProps) {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [bidTimer, setBidTimer] = useState(15)
    const [budget, setBudget] = useState(1000)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Player selection state
    const [selectedPlayers, setSelectedPlayers] = useState<
        Map<string, { player_id: string; base_price: number }>
    >(new Map())
    const [searchQuery, setSearchQuery] = useState('')

    // Manager selection state
    const [selectedManagers, setSelectedManagers] = useState<Set<string>>(new Set())

    function toggleManager(managerId: string) {
        setSelectedManagers(prev => {
            const next = new Set(prev)
            if (next.has(managerId)) {
                next.delete(managerId)
            } else {
                next.add(managerId)
            }
            return next
        })
    }

    function togglePlayer(player: Player) {
        setSelectedPlayers(prev => {
            const next = new Map(prev)
            if (next.has(player.id)) {
                next.delete(player.id)
            } else {
                next.set(player.id, { player_id: player.id, base_price: 100 })
            }
            return next
        })
    }

    function updateBasePrice(playerId: string, price: number) {
        setSelectedPlayers(prev => {
            const next = new Map(prev)
            const entry = next.get(playerId)
            if (entry) {
                next.set(playerId, { ...entry, base_price: price })
            }
            return next
        })
    }

    function selectAll() {
        const map = new Map<string, { player_id: string; base_price: number }>()
        players.forEach(p => map.set(p.id, { player_id: p.id, base_price: 100 }))
        setSelectedPlayers(map)
    }

    function deselectAll() {
        setSelectedPlayers(new Map())
    }

    const filteredPlayers = players.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (selectedPlayers.size === 0) {
            setError('Please select at least one player')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const result = await createAuction({
                title,
                description,
                scheduled_at: new Date(scheduledAt).toISOString(),
                bid_timer_seconds: bidTimer,
                budget_per_manager: budget,
                players: Array.from(selectedPlayers.values()),
                managerIds: Array.from(selectedManagers),
            })
            router.push(`/auctions/${result.id}`)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Event Details */}
            <div className="rounded-xl border border-border bg-surface-1 p-5">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Event Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-text-muted">Title</span>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Season 3 Player Auction"
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">Date & Time</span>
                        <input
                            type="datetime-local"
                            required
                            value={scheduledAt}
                            onChange={e => setScheduledAt(e.target.value)}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">Bid Timer (seconds)</span>
                        <input
                            type="number"
                            required
                            min={5}
                            max={120}
                            value={bidTimer}
                            onChange={e => setBidTimer(Number(e.target.value))}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-text-muted">Budget per Manager</span>
                        <input
                            type="number"
                            required
                            min={100}
                            value={budget}
                            onChange={e => setBudget(Number(e.target.value))}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-text-muted">Rules / Description</span>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe the auction rules..."
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                        />
                    </label>
                </div>
            </div>

            {/* Player Selection */}
            <div className="rounded-xl border border-border bg-surface-1 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Select Players <span className="text-sm font-normal text-text-muted">({selectedPlayers.size} selected)</span>
                    </h2>
                    <div className="flex gap-2">
                        <button type="button" onClick={selectAll} className="text-xs text-accent hover:text-accent-hover transition-colors">
                            Select All
                        </button>
                        <span className="text-text-muted">|</span>
                        <button type="button" onClick={deselectAll} className="text-xs text-text-muted hover:text-text-primary transition-colors">
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Search */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search players..."
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 mb-3"
                />

                {/* Player list */}
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                    {filteredPlayers.length === 0 ? (
                        <p className="p-4 text-center text-sm text-text-muted">No players found.</p>
                    ) : (
                        filteredPlayers.map(player => {
                            const isSelected = selectedPlayers.has(player.id)
                            const entry = selectedPlayers.get(player.id)
                            return (
                                <div
                                    key={player.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-2'}`}
                                    onClick={() => togglePlayer(player)}
                                >
                                    {/* Checkbox */}
                                    <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                                        {isSelected && (
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Player info */}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-text-primary">
                                            {player.first_name} {player.last_name}
                                        </span>
                                        <span className="ml-2 text-xs text-text-muted capitalize">
                                            {player.player_position ?? 'N/A'} · Score: {player.base_score}
                                        </span>
                                    </div>

                                    {/* Base price input */}
                                    {isSelected && (
                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                            <span className="text-xs text-text-muted">Base:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={entry?.base_price ?? 100}
                                                onChange={e => updateBasePrice(player.id, Number(e.target.value))}
                                                className="w-20 rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent/40"
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Optional Manager Assignment */}
            {managers.length > 0 && (
                <div className="rounded-xl border border-border bg-surface-1 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">
                            Pre-assign Managers <span className="text-sm font-normal text-text-muted">(Optional)</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 max-h-[250px] overflow-y-auto gap-2">
                        {managers.map(manager => {
                            const isSelected = selectedManagers.has(manager.id)
                            return (
                                <div
                                    key={manager.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer rounded border ${isSelected ? 'bg-accent/10 border-accent/30' : 'bg-surface-2 border-border hover:border-accent/30'}`}
                                    onClick={() => toggleManager(manager.id)}
                                >
                                    {/* Checkbox */}
                                    <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                                        {isSelected && (
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-text-primary">
                                            {manager.first_name} {manager.last_name}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Error + Submit */}
            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Auction'}
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { addPlayersToTournament, removePlayerFromTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface Player {
    id: string
    first_name: string
    last_name: string
    player_position: string | null
    base_score: number
}

interface ManagePlayersModalProps {
    tournamentId: string
    allPlayers: Player[]
    existingPlayerIds: string[]
    auctionId?: string | null
    existingBasePrices?: Record<string, number>
    onClose: () => void
}

export function AddPlayersModal({ tournamentId, allPlayers, existingPlayerIds, auctionId = null, existingBasePrices = {}, onClose }: ManagePlayersModalProps) {
    const router = useRouter()
    const toast = useToast()
    const [selected, setSelected] = useState<Set<string>>(new Set(existingPlayerIds))
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)

    // Base price per player — initialized from existing auction_players or default 20
    const [basePrices, setBasePrices] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        allPlayers.forEach(p => {
            initial[p.id] = existingBasePrices[p.id] ?? 20
        })
        return initial
    })

    const filtered = allPlayers.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function selectAll() {
        setSelected(prev => {
            const next = new Set(prev)
            filtered.forEach(p => next.add(p.id))
            return next
        })
    }

    function deselectAll() {
        setSelected(prev => {
            const next = new Set(prev)
            filtered.forEach(p => next.delete(p.id))
            return next
        })
    }

    function updateBasePrice(playerId: string, price: number) {
        setBasePrices(prev => ({ ...prev, [playerId]: price }))
    }

    async function handleSave() {
        setSaving(true)
        try {
            const existingSet = new Set(existingPlayerIds)
            const toAdd = Array.from(selected).filter(id => !existingSet.has(id))
            const toRemove = existingPlayerIds.filter(id => !selected.has(id))

            // Build base prices map for adds
            const addBasePrices: Record<string, number> = {}
            toAdd.forEach(id => { addBasePrices[id] = basePrices[id] ?? 20 })

            // Also update base prices for existing players that changed
            const updatedBasePrices: Record<string, number> = {}
            existingPlayerIds.forEach(id => {
                if (selected.has(id) && basePrices[id] !== (existingBasePrices[id] ?? 20)) {
                    updatedBasePrices[id] = basePrices[id]
                }
            })
            const updatedPlayerIds = Object.keys(updatedBasePrices)

            // Run additions, removals, and base price updates
            const promises: Promise<void>[] = []
            if (toAdd.length > 0) {
                promises.push(addPlayersToTournament(tournamentId, toAdd, auctionId, addBasePrices))
            }
            for (const pid of toRemove) {
                promises.push(removePlayerFromTournament(tournamentId, pid, auctionId))
            }
            // Update base prices for existing players
            if (updatedPlayerIds.length > 0 && auctionId) {
                promises.push(addPlayersToTournament(tournamentId, updatedPlayerIds, auctionId, updatedBasePrices))
            }
            await Promise.all(promises)

            const changes: string[] = []
            if (toAdd.length > 0) changes.push(`${toAdd.length} added`)
            if (toRemove.length > 0) changes.push(`${toRemove.length} removed`)
            if (updatedPlayerIds.length > 0) changes.push(`${updatedPlayerIds.length} base price updated`)

            if (changes.length > 0) {
                toast.success(`Players updated: ${changes.join(', ')}`)
            } else {
                toast.success('No changes made')
            }

            router.refresh()
            onClose()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update players')
            setSaving(false)
        }
    }

    const addedCount = Array.from(selected).filter(id => !new Set(existingPlayerIds).has(id)).length
    const removedCount = existingPlayerIds.filter(id => !selected.has(id)).length
    const priceChangedCount = existingPlayerIds.filter(id =>
        selected.has(id) && basePrices[id] !== (existingBasePrices[id] ?? 20)
    ).length
    const hasChanges = addedCount > 0 || removedCount > 0 || priceChangedCount > 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Manage Players</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3 overflow-hidden">
                    {/* Search */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                            {selected.size} selected
                            {hasChanges && (
                                <span className="ml-1 text-accent">
                                    ({addedCount > 0 && `+${addedCount}`}{addedCount > 0 && removedCount > 0 && ', '}{removedCount > 0 && `-${removedCount}`}{priceChangedCount > 0 && (addedCount > 0 || removedCount > 0 ? ', ' : '')}{priceChangedCount > 0 && `${priceChangedCount} price changed`})
                                </span>
                            )}
                        </span>
                        <div className="flex gap-2">
                            <button type="button" onClick={selectAll} className="text-xs text-accent hover:text-accent-hover transition-colors">Select All</button>
                            <span className="text-text-muted">|</span>
                            <button type="button" onClick={deselectAll} className="text-xs text-text-muted hover:text-text-primary transition-colors">Deselect All</button>
                        </div>
                    </div>

                    {/* Player list */}
                    <div className="max-h-[350px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                        {filtered.length === 0 ? (
                            <p className="p-4 text-center text-sm text-text-muted">No matching players found.</p>
                        ) : (
                            filtered.map(player => {
                                const isSelected = selected.has(player.id)
                                const wasExisting = existingPlayerIds.includes(player.id)
                                // Show visual indicator for changes
                                let indicator = ''
                                if (isSelected && !wasExisting) indicator = 'border-l-2 border-l-emerald-400'
                                else if (!isSelected && wasExisting) indicator = 'border-l-2 border-l-red-400'

                                return (
                                    <div
                                        key={player.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-2'} ${indicator}`}
                                        onClick={() => toggle(player.id)}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors flex-shrink-0 ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                                            {isSelected && (
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-text-primary">
                                                {player.first_name} {player.last_name}
                                            </span>
                                            <span className="ml-2 text-xs text-text-muted capitalize">
                                                {player.player_position ?? 'N/A'} · Score: {player.base_score}
                                            </span>
                                        </div>
                                        {/* Base price input — shown when selected and auction is linked */}
                                        {isSelected && auctionId && (
                                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                <span className="text-xs text-text-muted">Base:</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={basePrices[player.id] ?? 20}
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

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

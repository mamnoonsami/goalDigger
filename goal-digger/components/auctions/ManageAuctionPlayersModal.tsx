'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { updateAuctionPlayers } from '../../app/actions/auctions'
import { useToast } from '../providers/ToastProvider'

interface Player {
    id: string
    first_name: string
    last_name: string
    player_position: string | null
    base_score: number
}

interface ManageAuctionPlayersModalProps {
    auctionId: string
    allPlayers: Player[]
    initialAssignedIds: string[]
    soldPlayerIds: string[]
    onClose: () => void
}

export function ManageAuctionPlayersModal({ auctionId, allPlayers, initialAssignedIds, soldPlayerIds, onClose }: ManageAuctionPlayersModalProps) {
    const router = useRouter()
    const toast = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set(initialAssignedIds))
    const soldPlayers = new Set(soldPlayerIds)

    const filteredPlayers = allPlayers.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    function togglePlayer(playerId: string) {
        if (soldPlayers.has(playerId)) {
            toast.warning('Cannot remove a player that has already been sold')
            return
        }
        setSelectedPlayers(prev => {
            const next = new Set(prev)
            if (next.has(playerId)) next.delete(playerId)
            else next.add(playerId)
            return next
        })
    }

    function selectAll() {
        const set = new Set<string>()
        allPlayers.forEach(p => set.add(p.id))
        setSelectedPlayers(set)
    }

    function deselectAll() {
        const set = new Set<string>()
        soldPlayerIds.forEach(id => set.add(id)) // retain sold
        setSelectedPlayers(set)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const initialSet = new Set(initialAssignedIds)
            const playersToAdd: string[] = []
            const playersToRemove: string[] = []

            for (const id of selectedPlayers) {
                if (!initialSet.has(id)) playersToAdd.push(id)
            }
            for (const id of initialSet) {
                if (!selectedPlayers.has(id) && !soldPlayers.has(id)) playersToRemove.push(id)
            }

            await updateAuctionPlayers(auctionId, playersToAdd, playersToRemove)
            toast.success('Players updated successfully')
            router.refresh()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            toast.error('Failed to update players')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-2xl border border-border flex flex-col h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Manage Players</h2>
                        <p className="text-xs text-text-muted">{selectedPlayers.size} players selected</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex flex-col flex-1 min-h-0 p-4 gap-3 overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search players..."
                            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button type="button" onClick={selectAll} className="text-xs text-accent hover:underline">Select All</button>
                            <span className="text-border">|</span>
                            <button type="button" onClick={deselectAll} className="text-xs text-text-muted hover:text-text-primary hover:underline">Deselect All</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-lg border border-border divide-y divide-border bg-surface-2">
                        {filteredPlayers.length === 0 ? (
                            <p className="p-8 text-center text-sm text-text-muted">No players found.</p>
                        ) : (
                            filteredPlayers.map(player => {
                                const isSelected = selectedPlayers.has(player.id)
                                const isSold = soldPlayers.has(player.id)

                                return (
                                    <div
                                        key={player.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-3'} ${isSold ? 'opacity-70 grayscale' : ''}`}
                                        onClick={() => togglePlayer(player.id)}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                                            {isSelected && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-text-primary truncate">{player.first_name} {player.last_name}</span>
                                                <span className="text-xs text-text-muted truncate">Base Score: {player.base_score}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-surface-1 text-text-muted border border-border/50">
                                                    {player.player_position ?? 'N/A'}
                                                </span>
                                                {isSold && <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 rounded bg-accent/20 border border-accent/30">SOLD</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="button" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Players'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { updateDeclinedPlayers } from '../../app/actions/matches'
import { useToast } from '../providers/ToastProvider'

interface Player {
    id: string
    first_name: string
    last_name: string
    player_position: string | null
    base_score: number
    avatar_url: string | null
}

interface ManageDeclinedPlayersModalProps {
    matchId: string
    allPlayers: Player[]
    initialDeclinedIds: string[]
    onClose: () => void
}

export function ManageDeclinedPlayersModal({ matchId, allPlayers, initialDeclinedIds, onClose }: ManageDeclinedPlayersModalProps) {
    const router = useRouter()
    const toast = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set(initialDeclinedIds))

    const filteredPlayers = allPlayers.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    function togglePlayer(playerId: string) {
        setSelectedPlayers(prev => {
            const next = new Set(prev)
            if (next.has(playerId)) next.delete(playerId)
            else next.add(playerId)
            return next
        })
    }

    function selectAllFiltered() {
        const set = new Set(selectedPlayers)
        filteredPlayers.forEach(p => set.add(p.id))
        setSelectedPlayers(set)
    }

    function deselectAllFiltered() {
        const set = new Set(selectedPlayers)
        filteredPlayers.forEach(p => set.delete(p.id))
        setSelectedPlayers(set)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const initialSet = new Set(initialDeclinedIds)
            const playersToAdd: string[] = []
            const playersToRemove: string[] = []

            for (const id of selectedPlayers) {
                if (!initialSet.has(id)) playersToAdd.push(id)
            }
            for (const id of initialSet) {
                if (!selectedPlayers.has(id)) playersToRemove.push(id)
            }

            await updateDeclinedPlayers(matchId, playersToAdd, playersToRemove)
            toast.success('Declined players list updated successfully')
            router.refresh()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            toast.error('Failed to update declined players')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-2xl border border-border flex flex-col h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Manage "Can't Make It" List</h2>
                        <p className="text-xs text-text-muted">{selectedPlayers.size} players marked as not coming</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex flex-col flex-1 min-h-0 p-4 gap-4 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search all users..."
                                className="w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow"
                            />
                            <svg className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button type="button" onClick={selectAllFiltered} className="text-xs font-medium text-accent hover:underline px-2 py-1 rounded hover:bg-accent/10 transition-colors">Select All</button>
                            <span className="text-border">|</span>
                            <button type="button" onClick={deselectAllFiltered} className="text-xs font-medium text-text-muted hover:text-text-primary hover:underline px-2 py-1 rounded hover:bg-surface-3 transition-colors">Deselect All</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-lg border border-border divide-y divide-border bg-surface-2 shadow-inner">
                        {filteredPlayers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface-1/50">
                                <span className="text-2xl mb-2">🔍</span>
                                <p className="text-sm font-medium text-text-primary">No players found</p>
                                <p className="text-xs text-text-muted mt-1">Try refining your search query</p>
                            </div>
                        ) : (
                            filteredPlayers.map(player => {
                                const isSelected = selectedPlayers.has(player.id)

                                return (
                                    <div
                                        key={player.id}
                                        className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${isSelected ? 'bg-danger/5 hover:bg-danger/10' : 'hover:bg-surface-3'}`}
                                        onClick={() => togglePlayer(player.id)}
                                    >
                                        <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-danger bg-danger text-white' : 'border-border bg-surface-1'}`}>
                                            {isSelected && <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        
                                        {player.avatar_url ? (
                                            <img src={player.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                                                {player.first_name?.[0]}{player.last_name?.[0]}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-medium text-text-primary truncate">{player.first_name} {player.last_name}</span>
                                                <span className="text-xs text-text-muted truncate">Rating: {player.base_score}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-md capitalize bg-surface-1 text-text-muted border border-border/50 shadow-sm mr-2">
                                                    {player.player_position ?? 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-1 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button" disabled={saving}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit} disabled={saving} className="min-w-[120px]" variant="danger">
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Saving...
                            </span>
                        ) : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { addPlayersToTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface Player {
    id: string
    first_name: string
    last_name: string
    player_position: string | null
    base_score: number
}

interface AddPlayersModalProps {
    tournamentId: string
    allPlayers: Player[]
    existingPlayerIds: string[]
    onClose: () => void
}

export function AddPlayersModal({ tournamentId, allPlayers, existingPlayerIds, onClose }: AddPlayersModalProps) {
    const router = useRouter()
    const toast = useToast()
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)

    // Filter out already-added players and apply search
    const available = allPlayers.filter(p => {
        if (existingPlayerIds.includes(p.id)) return false
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
        setSelected(new Set(available.map(p => p.id)))
    }

    function deselectAll() {
        setSelected(new Set())
    }

    async function handleSubmit() {
        if (selected.size === 0) return
        setSaving(true)
        try {
            await addPlayersToTournament(tournamentId, Array.from(selected))
            toast.success(`Added ${selected.size} player${selected.size > 1 ? 's' : ''} to tournament`)
            router.refresh()
            onClose()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to add players')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Add Players to Tournament</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3 overflow-hidden">
                    {/* Search + bulk actions */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search players..."
                            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{selected.size} selected · {available.length} available</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={selectAll} className="text-xs text-accent hover:text-accent-hover transition-colors">Select All</button>
                            <span className="text-text-muted">|</span>
                            <button type="button" onClick={deselectAll} className="text-xs text-text-muted hover:text-text-primary transition-colors">Deselect All</button>
                        </div>
                    </div>

                    {/* Player list */}
                    <div className="max-h-[350px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                        {available.length === 0 ? (
                            <p className="p-4 text-center text-sm text-text-muted">
                                {searchQuery ? 'No matching players found.' : 'All players are already in this tournament.'}
                            </p>
                        ) : (
                            available.map(player => {
                                const isSelected = selected.has(player.id)
                                return (
                                    <div
                                        key={player.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-2'}`}
                                        onClick={() => toggle(player.id)}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
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
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving || selected.size === 0}>
                        {saving ? 'Adding...' : `Add ${selected.size} Player${selected.size !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    )
}

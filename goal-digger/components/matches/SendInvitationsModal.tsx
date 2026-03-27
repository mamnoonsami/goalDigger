'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { useToast } from '../providers/ToastProvider'
import { sendMatchInvitation } from '../../app/actions/matches'

interface Player {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
}

interface SendInvitationsModalProps {
    matchId: string
    scheduledAt: string
    allPlayers: Player[]
    signedInIds: string[]
    declinedIds: string[]
    onClose: () => void
}

export function SendInvitationsModal({ matchId, scheduledAt, allPlayers, signedInIds, declinedIds, onClose }: SendInvitationsModalProps) {
    const toast = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [sending, setSending] = useState(false)
    const [progress, setProgress] = useState(0)

    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(() => {
        const set = new Set<string>()
        allPlayers.forEach(p => {
            if (!signedInIds.includes(p.id) && !declinedIds.includes(p.id)) {
                set.add(p.id)
            }
        })
        return set
    })

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
        filteredPlayers.forEach(p => {
            if (!signedInIds.includes(p.id)) {
                set.add(p.id)
            }
        })
        setSelectedPlayers(set)
    }

    function deselectAllFiltered() {
        const set = new Set(selectedPlayers)
        filteredPlayers.forEach(p => set.delete(p.id))
        setSelectedPlayers(set)
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (selectedPlayers.size === 0) {
            toast.error('Please select at least one player to invite.')
            return
        }

        setSending(true)
        setProgress(0)

        let successCount = 0
        let errorCount = 0

        for (const playerId of Array.from(selectedPlayers)) {
            try {
                // Formatting time on the client to use local timezone
                const localizedTime = new Date(scheduledAt).toLocaleString()
                await sendMatchInvitation(matchId, playerId, localizedTime)
                successCount++
            } catch (err: unknown) {
                console.error(`Error sending to ${playerId}:`, err)
                errorCount++
            }
            setProgress(prev => prev + 1)
        }

        setSending(false)
        if (errorCount > 0) {
            toast.error(`Failed to send ${errorCount} invitations. Sent ${successCount}.`)
        } else {
            toast.success(`Successfully sent ${successCount} invitations!`)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-2xl border border-border flex flex-col h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Send Match Invitations</h2>
                        <p className="text-xs text-text-muted">{selectedPlayers.size} players selected</p>
                    </div>
                    <button onClick={onClose} disabled={sending} className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50">
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
                                disabled={sending}
                                placeholder="Search players to invite..."
                                className="w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow disabled:opacity-50"
                            />
                            <svg className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button type="button" onClick={selectAllFiltered} disabled={sending} className="text-xs font-medium text-accent hover:underline px-2 py-1 rounded hover:bg-accent/10 transition-colors disabled:opacity-50">Select All</button>
                            <span className="text-border">|</span>
                            <button type="button" onClick={deselectAllFiltered} disabled={sending} className="text-xs font-medium text-text-muted hover:text-text-primary hover:underline px-2 py-1 rounded hover:bg-surface-3 transition-colors disabled:opacity-50">Deselect All</button>
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
                                const isDeclined = declinedIds.includes(player.id)
                                const isSignedUp = signedInIds.includes(player.id)

                                return (
                                    <div
                                        key={player.id}
                                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${sending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-surface-3'} ${isSelected && !sending ? 'bg-accent/5 hover:bg-accent/10' : ''}`}
                                        onClick={() => !sending && togglePlayer(player.id)}
                                    >
                                        <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${isSelected ? 'border-accent bg-accent text-white' : 'border-border bg-surface-1'}`}>
                                            {isSelected && <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>

                                        {player.avatar_url ? (
                                            <img src={player.avatar_url} alt="" className={`w-8 h-8 rounded-full object-cover border border-border ${isDeclined ? 'grayscale opacity-60' : ''}`} />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0 ${isDeclined ? 'opacity-60' : ''}`}>
                                                {player.first_name?.[0]}{player.last_name?.[0]}
                                            </div>
                                        )}

                                        <div className="flex flex-col truncate flex-1 min-w-0">
                                            <span className={`text-sm font-medium truncate ${isDeclined ? 'text-text-muted' : 'text-text-primary'}`}>{player.first_name} {player.last_name}</span>
                                            {isDeclined && <span className="text-[10px] uppercase tracking-wider font-bold text-danger/70 mt-0.5">Can't Make It</span>}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    {sending && (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-surface-1 border border-border rounded-lg shadow-sm">
                            <div className="relative flex items-center justify-center">
                                <svg className="animate-spin h-8 w-8 text-accent opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                </svg>
                                <svg className="animate-spin h-8 w-8 text-accent absolute left-0 top-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div className="text-sm font-medium text-text-primary">
                                Sending {progress} of {selectedPlayers.size} invitations...
                            </div>
                            <div className="w-full max-w-xs bg-surface-3 rounded-full h-2 mt-2 overflow-hidden border border-border">
                                <div className="bg-accent h-2 transition-all duration-300 ease-out" style={{ width: `${(progress / Math.max(1, selectedPlayers.size)) * 100}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-1 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button" disabled={sending}>Cancel</Button>
                    <Button type="button" onClick={handleSend} disabled={sending || selectedPlayers.size === 0} className="min-w-[150px]">
                        {sending ? 'Sending...' : 'Send Invitations'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

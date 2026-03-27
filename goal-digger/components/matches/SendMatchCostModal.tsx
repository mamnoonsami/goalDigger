'use client'

import { useState, useMemo } from 'react'
import { Button } from '../ui/Button'
import { useToast } from '../providers/ToastProvider'
import { sendMatchCostEmail } from '../../app/actions/matches'

interface SignupPlayer {
    player_id: string
    profiles: {
        first_name: string
        last_name: string
        avatar_url: string | null
    }
}

interface SendMatchCostModalProps {
    matchId: string
    scheduledAt: string
    signups: SignupPlayer[]
    onClose: () => void
}

export function SendMatchCostModal({ matchId, scheduledAt, signups, onClose }: SendMatchCostModalProps) {
    const toast = useToast()
    const [sending, setSending] = useState(false)
    const [progress, setProgress] = useState(0)

    // Pre-select all signed-up players by default
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set(signups.map(s => s.player_id)))
    const [totalCost, setTotalCost] = useState<string>('150')
    const [customNumPlayers, setCustomNumPlayers] = useState<string>('')

    const numericTotalCost = parseFloat(totalCost) || 0
    const activeNumPlayers = customNumPlayers !== '' ? (parseInt(customNumPlayers) || 0) : selectedPlayers.size
    const costPerPerson = activeNumPlayers > 0 ? (numericTotalCost / activeNumPlayers) : 0

    function togglePlayer(playerId: string) {
        setSelectedPlayers(prev => {
            const next = new Set(prev)
            if (next.has(playerId)) next.delete(playerId)
            else next.add(playerId)
            return next
        })
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (selectedPlayers.size === 0) {
            toast.error('Please select at least one player to request costs from.')
            return
        }
        if (numericTotalCost <= 0) {
            toast.error('Please enter a valid total cost amount.')
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
                await sendMatchCostEmail(matchId, playerId, localizedTime, costPerPerson)
                successCount++
            } catch (err: unknown) {
                console.error(`Error sending cost request to ${playerId}:`, err)
                errorCount++
            }
            setProgress(prev => prev + 1)
        }

        setSending(false)
        if (errorCount > 0) {
            toast.error(`Failed to send ${errorCount} requests. Sent ${successCount}.`)
        } else {
            toast.success(`Successfully sent ${successCount} cost requests!`)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col h-[85vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Send Match Cost</h2>
                        <p className="text-xs text-text-muted">Request e-Transfer from players</p>
                    </div>
                    <button onClick={onClose} disabled={sending} className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 gap-6">
                    {/* Cost Configurator */}
                    <div className="bg-surface-2 border border-border rounded-lg p-5 flex flex-col gap-4 shadow-inner">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Total Cost ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={totalCost}
                                        onChange={(e) => setTotalCost(e.target.value)}
                                        disabled={sending}
                                        className="w-full rounded-md border border-border bg-surface-1 pl-8 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow disabled:opacity-50 font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Divided By</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder={String(selectedPlayers.size)}
                                        value={customNumPlayers}
                                        onChange={(e) => setCustomNumPlayers(e.target.value)}
                                        disabled={sending}
                                        className="w-full rounded-md border border-border bg-surface-1 pl-3 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-shadow disabled:opacity-50 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/50 text-center">
                            <p className="text-xs text-text-muted mb-1">Cost Per Person</p>
                            <div className="text-3xl font-black text-accent tracking-tight">
                                ${costPerPerson.toFixed(2)}
                            </div>
                            <p className="text-xs text-text-muted mt-1 font-medium italic">Each player will be asked to pay this amount.</p>
                        </div>
                    </div>

                    <div className="flex flex-col flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-surface-2 shadow-inner">
                        <div className="border-b border-border bg-surface-2 px-4 py-3 flex justify-between items-center shadow-sm z-10 sticky top-0">
                            <h3 className="text-sm font-semibold text-text-primary">Selected Players</h3>
                            <button 
                                type="button" 
                                onClick={() => setSelectedPlayers(new Set(signups.map(s => s.player_id)))} 
                                disabled={sending || selectedPlayers.size === signups.length}
                                className="text-xs font-medium text-accent hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                Reset to All ({signups.length})
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 max-h-[250px]">
                            {signups.length === 0 ? (
                                <div className="p-4 text-center text-sm text-text-muted">No players signed up for this match yet.</div>
                            ) : (
                                signups.map(signup => {
                                    const isSelected = selectedPlayers.has(signup.player_id)
                                    return (
                                        <div
                                            key={signup.player_id}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors ${sending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-surface-3'} ${isSelected && !sending ? 'bg-accent/5' : ''}`}
                                            onClick={() => !sending && togglePlayer(signup.player_id)}
                                        >
                                            <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${isSelected ? 'border-accent bg-accent text-white' : 'border-border bg-surface-1'}`}>
                                                {isSelected && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            
                                            {signup.profiles.avatar_url ? (
                                                <img src={signup.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover border border-border" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-surface-3 border border-border flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0">
                                                    {signup.profiles.first_name?.[0]}{signup.profiles.last_name?.[0]}
                                                </div>
                                            )}
                                            <span className="text-sm text-text-primary font-medium">{signup.profiles.first_name} {signup.profiles.last_name}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {sending && (
                        <div className="flex flex-col items-center justify-center p-4 space-y-3 bg-surface-1 border border-border rounded-lg shadow-sm">
                            <div className="relative flex items-center justify-center">
                                <svg className="animate-spin h-6 w-6 text-accent opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                </svg>
                                <svg className="animate-spin h-6 w-6 text-accent absolute left-0 top-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div className="text-sm font-medium text-text-primary">
                                Sending {progress} of {selectedPlayers.size} requests...
                            </div>
                            <div className="w-full max-w-[200px] bg-surface-3 rounded-full h-1.5 mt-2 overflow-hidden border border-border">
                                <div className="bg-accent h-1.5 transition-all duration-300 ease-out" style={{ width: `${(progress / Math.max(1, selectedPlayers.size)) * 100}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-1 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button" disabled={sending}>Cancel</Button>
                    <Button type="button" onClick={handleSend} disabled={sending || selectedPlayers.size === 0 || numericTotalCost <= 0} className="min-w-[150px]">
                        {sending ? 'Sending...' : 'Send Cost Requests'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

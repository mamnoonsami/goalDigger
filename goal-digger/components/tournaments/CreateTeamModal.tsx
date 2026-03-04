'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { createTeamForTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface CreateTeamModalProps {
    tournamentId: string
    onClose: () => void
}

export function CreateTeamModal({ tournamentId, onClose }: CreateTeamModalProps) {
    const router = useRouter()
    const toast = useToast()

    const [teamName, setTeamName] = useState('')
    const [teamSlogan, setTeamSlogan] = useState('')
    const [numberOfPlayers, setNumberOfPlayers] = useState(5)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!teamName.trim()) return
        setSaving(true)
        setError(null)
        try {
            await createTeamForTournament({
                tournament_id: tournamentId,
                team_name: teamName.trim(),
                team_slogan: teamSlogan.trim(),
                number_of_players: numberOfPlayers,
            })
            toast.success(`Team "${teamName.trim()}" created!`)
            router.refresh()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create team')
            toast.error('Failed to create team')
            setSaving(false)
        }
    }

    const inputClass = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-md border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Create Team</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <form id="create-team-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Team Name *</span>
                            <input
                                type="text"
                                required
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                placeholder="e.g. Thunder FC"
                                className={inputClass}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Team Slogan</span>
                            <input
                                type="text"
                                value={teamSlogan}
                                onChange={e => setTeamSlogan(e.target.value)}
                                placeholder="e.g. Strike like lightning!"
                                className={inputClass}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-text-muted">Number of Players</span>
                            <input
                                type="number"
                                required
                                min={1}
                                value={numberOfPlayers}
                                onChange={e => setNumberOfPlayers(Number(e.target.value))}
                                className={inputClass}
                            />
                        </label>
                    </form>

                    {error && <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" form="create-team-form" disabled={saving || !teamName.trim()}>
                        {saving ? 'Creating...' : 'Create Team'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

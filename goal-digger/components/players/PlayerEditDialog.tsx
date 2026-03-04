'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { updatePlayer } from '../../app/actions/players'

interface PlayerEditDialogProps {
    player: {
        id: string
        first_name: string
        last_name: string
        player_position: string | null
        base_score: number
        goals: number
        matches_played: number
        role: string
    }
    onClose: () => void
}

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward']
const ROLES = ['admin', 'manager', 'player', 'viewer']

export function PlayerEditDialog({ player, onClose }: PlayerEditDialogProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [firstName, setFirstName] = useState(player.first_name)
    const [lastName, setLastName] = useState(player.last_name)
    const [position, setPosition] = useState(player.player_position ?? '')
    const [baseScore, setBaseScore] = useState(player.base_score)
    const [goals, setGoals] = useState(player.goals)
    const [matchesPlayed, setMatchesPlayed] = useState(player.matches_played)
    const [role, setRole] = useState(player.role)

    async function handleSave() {
        setSaving(true)
        setError(null)
        try {
            await updatePlayer(player.id, {
                first_name: firstName,
                last_name: lastName,
                player_position: position || null,
                base_score: baseScore,
                goals,
                matches_played: matchesPlayed,
                role,
            })
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-2xl bg-surface-2 border border-border shadow-2xl">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Edit Player</h2>
                    <p className="text-xs text-text-muted mt-0.5">{player.first_name} {player.last_name}</p>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">First Name</span>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">Last Name</span>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </label>
                    </div>

                    {/* Position & Role */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">Position</span>
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            >
                                <option value="">Not set</option>
                                {POSITIONS.map((pos) => (
                                    <option key={pos} value={pos}>{pos.charAt(0).toUpperCase() + pos.slice(1)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">Role</span>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Numeric stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">Base Score</span>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={baseScore}
                                onChange={(e) => setBaseScore(Number(e.target.value))}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">Goals</span>
                            <input
                                type="number"
                                min={0}
                                value={goals}
                                onChange={(e) => setGoals(Number(e.target.value))}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-muted">Matches</span>
                            <input
                                type="number"
                                min={0}
                                value={matchesPlayed}
                                onChange={(e) => setMatchesPlayed(Number(e.target.value))}
                                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </label>
                    </div>

                    {error && <p className="text-sm text-danger">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button size="sm" isLoading={saving} onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}

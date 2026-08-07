'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { updateProfile } from '../../app/actions/profile'

interface ProfileFormProps {
    profile: {
        first_name: string
        last_name: string
        player_position: string | null
    }
}

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'striker']

export function ProfileForm({ profile }: ProfileFormProps) {
    const [position, setPosition] = useState(profile.player_position ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSave() {
        setSaving(true)
        setError(null)
        setSuccess(false)
        try {
            await updateProfile({ player_position: position || null })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <section aria-labelledby="player-details-heading">
                <div className="mb-4">
                    <h3 id="player-details-heading" className="text-sm font-semibold text-text-primary">Player details</h3>
                    <p className="mt-1 text-xs leading-5 text-text-muted">Your name is managed by your group administrator. You can update your playing position.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-text-muted">First name</span>
                        <input
                            type="text"
                            value={profile.first_name}
                            disabled
                            className="h-11 cursor-not-allowed rounded-lg border border-border bg-surface-2 px-3 text-sm text-text-muted opacity-70"
                        />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-text-muted">Last name</span>
                        <input
                            type="text"
                            value={profile.last_name}
                            disabled
                            className="h-11 cursor-not-allowed rounded-lg border border-border bg-surface-2 px-3 text-sm text-text-muted opacity-70"
                        />
                    </label>
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-xs font-medium text-text-muted">Playing position</span>
                        <select
                            value={position}
                            onChange={(event) => setPosition(event.target.value)}
                            className="h-11 w-full rounded-lg border border-border bg-surface-1 px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/15 sm:max-w-xs"
                        >
                            <option value="">Not set</option>
                            {POSITIONS.map((playerPosition) => (
                                <option key={playerPosition} value={playerPosition}>{playerPosition.charAt(0).toUpperCase() + playerPosition.slice(1)}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                <Button type="button" onClick={handleSave} isLoading={saving}>Save changes</Button>
                <div aria-live="polite" className="min-h-5 text-sm">
                    {success && <span className="text-success">Changes saved</span>}
                    {error && <span className="text-danger">{error}</span>}
                </div>
            </div>
        </div>
    )
}

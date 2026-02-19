'use client'

import { useState } from 'react'
import { updateMatch } from '../../app/actions/matches'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import type { Match } from '@goaldigger/core'
// Actually, let's use the local type definition if available or any.
// Since we are in the app, we can import from core.
// Depending on how pnpm workspaces are set up.
// Let's use `any` for match prop temporarily if type import fails, but best to try standard import.

interface MatchEditDialogProps {
    match: { id: string; location: string | null; scheduled_at: string; title: string }
    isOpen: boolean
    onClose: () => void
}

export function MatchEditDialog({ match, isOpen, onClose }: MatchEditDialogProps) {
    const [location, setLocation] = useState(match.location ?? '')
    // Format date for datetime-local input: YYYY-MM-DDTHH:mm
    const [date, setDate] = useState(() => {
        const d = new Date(match.scheduled_at)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()) // adjust for local time viewing in input
        return d.toISOString().slice(0, 16)
    })
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await updateMatch(match.id, {
                location,
                scheduled_at: new Date(date).toISOString(),
            })
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to update match')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-xl" padding="md">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Edit Match</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <p className="mb-2 text-sm text-text-muted">Currently editing: <span className="font-medium text-text-primary">{match.title}</span></p>
                    </div>

                    <Input
                        label="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Seton Park Field 1"
                    />

                    <Input
                        label="Date & Time"
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <div className="mt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

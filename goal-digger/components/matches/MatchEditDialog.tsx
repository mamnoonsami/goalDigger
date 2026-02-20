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
    match: { id: string; location: string | null; scheduled_at: string; title: string; status: string; max_players: number; notes: string | null }
    isOpen: boolean
    onClose: () => void
}

export function MatchEditDialog({ match, isOpen, onClose }: MatchEditDialogProps) {
    const [title, setTitle] = useState(match.title)
    const [status, setStatus] = useState(match.status)
    const [location, setLocation] = useState(match.location ?? '')
    const [maxPlayers, setMaxPlayers] = useState(match.max_players.toString())
    const [notes, setNotes] = useState(match.notes ?? '')

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
                title,
                status,
                location,
                max_players: parseInt(maxPlayers) || 0,
                notes,
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
            <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" padding="md">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Edit Match</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sunday Pick-up"
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-muted">Status</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="open">Open</option>
                            <option value="balanced">Balanced</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
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

                    <Input
                        label="Max Players"
                        type="number"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(e.target.value)}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-muted">Notes</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add generic notes..."
                        />
                    </div>

                    <div className="mt-2 flex justify-end gap-2 sticky bottom-0 bg-surface-2 py-2 border-t border-border">
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

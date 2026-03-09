'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { createMatch } from '../../app/actions/matches'
import { useToast } from '../providers/ToastProvider'

export function CreateMatchForm() {
    const router = useRouter()
    const toast = useToast()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState('')
    const [location, setLocation] = useState('')
    const [date, setDate] = useState('')
    const [maxPlayers, setMaxPlayers] = useState('14')
    const [notes, setNotes] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title || !date) {
            toast.error('Title and Date are required.')
            return
        }

        setIsSubmitting(true)
        try {
            await createMatch({
                title,
                location: location || undefined,
                scheduled_at: new Date(date).toISOString(),
                max_players: parseInt(maxPlayers) || 0,
                notes: notes || undefined,
            })
            toast.success('Match created successfully!')
            router.push('/matches')
        } catch (error) {
            console.error(error)
            toast.error('Failed to create match')
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">Match Details</h2>

                    <Input
                        label="Title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sunday Pick-up"
                    />

                    <Input
                        label="Date & Time"
                        required
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <Input
                        label="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Seton Park Field 1"
                    />

                    <Input
                        label="Max Players"
                        type="number"
                        min="2"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(e.target.value)}
                        placeholder="14"
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-muted">Notes</label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add generic notes..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="border-t border-border pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                    >
                        Create Match
                    </Button>
                </div>
            </form>
        </Card>
    )
}

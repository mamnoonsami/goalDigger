'use client'

import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useToast } from '../providers/ToastProvider'
import { createTournamentMatch } from '../../app/actions/tournaments'

interface Team {
    id: string
    team_name: string
}

interface Props {
    tournamentId: string
    teams: Team[]
    onClose: () => void
}

export function CreateTournamentMatchModal({ tournamentId, teams, onClose }: Props) {
    const toast = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [team1Id, setTeam1Id] = useState('')
    const [team2Id, setTeam2Id] = useState('')
    const [matchDate, setMatchDate] = useState('')
    const [matchTime, setMatchTime] = useState('')

    const dateRef = useRef<HTMLInputElement>(null)
    const timeRef = useRef<HTMLInputElement>(null)

    function openPicker(ref: React.RefObject<HTMLInputElement | null>) {
        try {
            ref.current?.showPicker()
        } catch {
            ref.current?.focus()
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!team1Id || !team2Id || !matchDate || !matchTime) {
            toast.error('Please fill in all fields')
            return
        }
        if (team1Id === team2Id) {
            toast.error('A team cannot play against itself')
            return
        }

        setIsSubmitting(true)
        try {
            const selectedLocalDateTime = new Date(`${matchDate}T${matchTime}`)
            await createTournamentMatch({
                tournament_id: tournamentId,
                team_1_id: team1Id,
                team_2_id: team2Id,
                match_date: selectedLocalDateTime.toISOString()
            })
            toast.success('Match scheduled successfully')
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to schedule match')
        } finally {
            setIsSubmitting(false)
        }
    }

    const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"

    return (
        <Modal title="Schedule Match" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-primary">Team 1 (Home)</label>
                    <select
                        value={team1Id}
                        onChange={e => setTeam1Id(e.target.value)}
                        className={fieldClass}
                        required
                    >
                        <option value="">Select Team</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.team_name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex justify-center text-text-muted text-xs font-bold my-2">VS</div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-primary">Team 2 (Away)</label>
                    <select
                        value={team2Id}
                        onChange={e => setTeam2Id(e.target.value)}
                        className={fieldClass}
                        required
                    >
                        <option value="">Select Team</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.team_name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-sm font-medium text-text-primary">Date &amp; Time</label>
                    <div className="flex gap-2">
                        {/* Date picker — clicking anywhere on the field opens the calendar */}
                        <div className="flex-1 relative">
                            <input
                                ref={dateRef}
                                type="date"
                                value={matchDate}
                                onChange={e => setMatchDate(e.target.value)}
                                className={`${fieldClass} w-full`}
                                style={{ colorScheme: 'auto' }}
                                required
                                onClick={() => openPicker(dateRef)}
                            />
                        </div>
                        {/* Time picker — clicking anywhere on the field opens the clock */}
                        <div className="w-32 relative">
                            <input
                                ref={timeRef}
                                type="time"
                                value={matchTime}
                                onChange={e => setMatchTime(e.target.value)}
                                className={`${fieldClass} w-full`}
                                style={{ colorScheme: 'auto' }}
                                required
                                onClick={() => openPicker(timeRef)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Scheduling...' : 'Schedule Match'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

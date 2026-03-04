'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { deleteTeamFromTournament } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface Team {
    id: string
    team_name: string
    team_slogan: string | null
    number_of_players: number
    manager_name: string
    player_count: number
}

interface ManageTeamsModalProps {
    tournamentId: string
    teams: Team[]
    onClose: () => void
}

export function ManageTeamsModal({ tournamentId, teams, onClose }: ManageTeamsModalProps) {
    const router = useRouter()
    const toast = useToast()
    const [toRemove, setToRemove] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)

    const filtered = teams.filter(t =>
        t.team_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    function toggleRemove(id: string) {
        setToRemove(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    async function handleSave() {
        if (toRemove.size === 0) return
        setSaving(true)
        try {
            await Promise.all(
                Array.from(toRemove).map(teamId =>
                    deleteTeamFromTournament(tournamentId, teamId)
                )
            )
            toast.success(`Removed ${toRemove.size} team${toRemove.size > 1 ? 's' : ''}`)
            router.refresh()
            onClose()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove teams')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Manage Teams</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3 overflow-hidden">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search teams..."
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                            {teams.length} teams total
                            {toRemove.size > 0 && (
                                <span className="ml-1 text-red-400">({toRemove.size} marked for removal)</span>
                            )}
                        </span>
                        {toRemove.size > 0 && (
                            <button
                                type="button"
                                onClick={() => setToRemove(new Set())}
                                className="text-xs text-text-muted hover:text-text-primary transition-colors"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                        {filtered.length === 0 ? (
                            <p className="p-4 text-center text-sm text-text-muted">
                                {searchQuery ? 'No matching teams found.' : 'No teams in this tournament.'}
                            </p>
                        ) : (
                            filtered.map(team => {
                                const isMarked = toRemove.has(team.id)
                                return (
                                    <div
                                        key={team.id}
                                        className={`flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer ${isMarked ? 'bg-red-500/5 border-l-2 border-l-red-400' : 'hover:bg-surface-2'}`}
                                        onClick={() => toggleRemove(team.id)}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors flex-shrink-0 ${isMarked ? 'border-red-400 bg-red-400 text-white' : 'border-accent bg-accent text-white'}`}>
                                            {!isMarked ? (
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${isMarked ? 'text-red-400 line-through' : 'text-text-primary'}`}>
                                                    {team.team_name}
                                                </span>
                                                <span className="text-xs text-text-muted bg-surface-3 rounded-full px-1.5 py-0.5">
                                                    {team.player_count} players
                                                </span>
                                            </div>
                                            <div className="text-xs text-text-muted mt-0.5">
                                                Manager: {team.manager_name}
                                                {team.team_slogan && <> · &ldquo;{team.team_slogan}&rdquo;</>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="danger" onClick={handleSave} disabled={saving || toRemove.size === 0}>
                        {saving ? 'Removing...' : toRemove.size > 0 ? `Remove ${toRemove.size} Team${toRemove.size > 1 ? 's' : ''}` : 'No Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

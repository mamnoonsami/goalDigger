'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { assignPlayersToTeam } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'

interface TournamentPlayer {
    id: string
    player_id: string
    team_id: string | null
    profiles: { first_name: string; last_name: string; player_position: string | null; avatar_url: string | null } | { first_name: string; last_name: string; player_position: string | null; avatar_url: string | null }[]
}

interface AssignPlayersToTeamModalProps {
    tournamentId: string
    teamId: string
    teamName: string
    allTournamentPlayers: TournamentPlayer[]
    onClose: () => void
}

export function AssignPlayersToTeamModal({ tournamentId, teamId, teamName, allTournamentPlayers, onClose }: AssignPlayersToTeamModalProps) {
    const router = useRouter()
    const toast = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)

    // Initialize selected with players already on this team
    const [selected, setSelected] = useState<Set<string>>(() => {
        const set = new Set<string>()
        allTournamentPlayers.forEach(tp => {
            if (tp.team_id === teamId) set.add(tp.player_id)
        })
        return set
    })

    const initiallySelected = new Set(
        allTournamentPlayers.filter(tp => tp.team_id === teamId).map(tp => tp.player_id)
    )

    // Filter: show all tournament players, but indicate if they're on another team
    const filtered = allTournamentPlayers.filter(tp => {
        const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
        const name = `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    function toggle(playerId: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(playerId)) next.delete(playerId)
            else next.add(playerId)
            return next
        })
    }

    async function handleSave() {
        setSaving(true)
        try {
            await assignPlayersToTeam(tournamentId, teamId, Array.from(selected))

            const added = Array.from(selected).filter(id => !initiallySelected.has(id)).length
            const removed = Array.from(initiallySelected).filter(id => !selected.has(id)).length

            const changes: string[] = []
            if (added > 0) changes.push(`${added} added`)
            if (removed > 0) changes.push(`${removed} removed`)

            toast.success(changes.length > 0 ? `Team roster updated: ${changes.join(', ')}` : 'No changes made')
            router.refresh()
            onClose()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to assign players')
            setSaving(false)
        }
    }

    const addedCount = Array.from(selected).filter(id => !initiallySelected.has(id)).length
    const removedCount = Array.from(initiallySelected).filter(id => !selected.has(id)).length
    const hasChanges = addedCount > 0 || removedCount > 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Assign Players</h2>
                        <p className="text-xs text-text-muted mt-0.5">Team: <span className="text-accent font-medium">{teamName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3 overflow-hidden">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                            {selected.size} selected
                            {hasChanges && (
                                <span className="ml-1 text-accent">
                                    ({addedCount > 0 && `+${addedCount}`}{addedCount > 0 && removedCount > 0 && ', '}{removedCount > 0 && `-${removedCount}`})
                                </span>
                            )}
                        </span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                        {filtered.length === 0 ? (
                            <p className="p-4 text-center text-sm text-text-muted">No players in this tournament yet.</p>
                        ) : (
                            filtered.map(tp => {
                                const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                const isSelected = selected.has(tp.player_id)
                                const isOnOtherTeam = tp.team_id !== null && tp.team_id !== teamId
                                const wasOnThisTeam = initiallySelected.has(tp.player_id)

                                let indicator = ''
                                if (isSelected && !wasOnThisTeam) indicator = 'border-l-2 border-l-emerald-400'
                                else if (!isSelected && wasOnThisTeam) indicator = 'border-l-2 border-l-red-400'

                                return (
                                    <div
                                        key={tp.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-2'} ${indicator}`}
                                        onClick={() => toggle(tp.player_id)}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors flex-shrink-0 ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                                            {isSelected && (
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {p?.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover bg-surface-3 flex-shrink-0" />
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                                                        {p?.first_name?.[0]}{p?.last_name?.[0]}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-text-primary">
                                                    {p?.first_name} {p?.last_name}
                                                </span>
                                                {isOnOtherTeam && (
                                                    <span className="text-[10px] text-amber-400 bg-amber-500/10 rounded-full px-1.5 py-0.5 font-medium">
                                                        On another team
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-text-muted capitalize ml-8">
                                                {p?.player_position ?? 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

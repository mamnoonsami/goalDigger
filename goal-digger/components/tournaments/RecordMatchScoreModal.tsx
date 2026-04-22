'use client'

import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useToast } from '../providers/ToastProvider'
import { recordTournamentMatchScore } from '../../app/actions/tournaments'

interface Player {
    player_id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    team_id: string | null
}

interface Team {
    id: string
    team_name: string
}

interface Props {
    tournamentId: string
    match: any
    team1: Team
    team2: Team
    team1Players: Player[]
    team2Players: Player[]
    initialStats?: { player_id: string; goals: number }[]
    onClose: () => void
}

export function RecordMatchScoreModal({ tournamentId, match, team1, team2, team1Players, team2Players, initialStats = [], onClose }: Props) {
    const toast = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [team1Score, setTeam1Score] = useState<number | string>(match.team_1_score?.toString() || '0')
    const [team2Score, setTeam2Score] = useState<number | string>(match.team_2_score?.toString() || '0')
    const [markCompleted, setMarkCompleted] = useState(match.status === 'completed')
    
    // player_id -> number of goals
    const [playerGoals, setPlayerGoals] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        initialStats.forEach(stat => {
            if (stat.goals > 0) initial[stat.player_id] = stat.goals
        })
        return initial
    })

    function updatePlayerGoal(playerId: string, delta: number, teamId: string) {
        setPlayerGoals(prev => {
            const current = prev[playerId] || 0
            const next = Math.max(0, current + delta)
            if (next === 0) {
                const copy = { ...prev }
                delete copy[playerId]
                return copy
            }
            return { ...prev, [playerId]: next }
        })

        if (teamId === team1.id) {
            setTeam1Score(prev => Math.max(0, (parseInt(prev.toString()) || 0) + delta).toString())
        } else if (teamId === team2.id) {
            setTeam2Score(prev => Math.max(0, (parseInt(prev.toString()) || 0) + delta).toString())
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        
        const t1ScoreNum = parseInt(team1Score.toString()) || 0;
        const t2ScoreNum = parseInt(team2Score.toString()) || 0;

        const t1GoalsAssigned = team1Players.reduce((sum, p) => sum + (playerGoals[p.player_id] || 0), 0)
        const t2GoalsAssigned = team2Players.reduce((sum, p) => sum + (playerGoals[p.player_id] || 0), 0)

        if (t1GoalsAssigned > t1ScoreNum) {
            toast.error(`${team1.team_name} players have been assigned more goals (${t1GoalsAssigned}) than the team score (${t1ScoreNum})`)
            return
        }
        if (t2GoalsAssigned > t2ScoreNum) {
            toast.error(`${team2.team_name} players have been assigned more goals (${t2GoalsAssigned}) than the team score (${t2ScoreNum})`)
            return
        }

        setIsSubmitting(true)
        try {
            const goalsArray = Object.entries(playerGoals).map(([playerId, goals]) => {
                const t1Match = team1Players.find(p => p.player_id === playerId)
                return {
                    player_id: playerId,
                    team_id: t1Match ? team1.id : team2.id,
                    goals
                }
            })

            await recordTournamentMatchScore(match.id, tournamentId, {
                team_1_score: t1ScoreNum,
                team_2_score: t2ScoreNum,
                player_goals: goalsArray,
                mark_completed: markCompleted
            })
            toast.success('Match score recorded')
            onClose()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderPlayerList = (players: Player[], teamName: string, teamScore: number | string, teamId: string) => {
        const scoreNum = parseInt(teamScore.toString()) || 0;
        const assignedGoals = players.reduce((sum, p) => sum + (playerGoals[p.player_id] || 0), 0)
        
        return (
            <div className="flex-1 bg-surface-2 p-3 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-text-primary text-sm">{teamName}</h4>
                    <span className={`text-xs font-semibold ${assignedGoals > scoreNum ? 'text-red-400' : 'text-text-muted'}`}>
                        {assignedGoals} / {scoreNum} goals
                    </span>
                </div>
                {players.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No players</p>
                ) : (
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {players.map(p => {
                            const goals = playerGoals[p.player_id] || 0
                            return (
                                <div key={p.player_id} className="flex items-center justify-between bg-surface-3 p-2 rounded text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {p.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                                                {p.first_name[0]}{p.last_name[0]}
                                            </div>
                                        )}
                                        <span className="text-text-primary truncate">{p.first_name} {p.last_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => updatePlayerGoal(p.player_id, -1, teamId)}
                                            disabled={goals === 0}
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-1 hover:bg-surface-2 text-text-muted disabled:opacity-50 transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="w-3 text-center font-bold text-accent">{goals}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => updatePlayerGoal(p.player_id, 1, teamId)}
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-1 hover:bg-surface-2 text-text-muted transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Modal title="Record Match Score" onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Score Input */}
                <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <label className="font-semibold text-text-primary truncate max-w-full text-center" title={team1.team_name}>
                            {team1.team_name}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={team1Score}
                            onChange={e => setTeam1Score(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-20 text-center text-3xl font-bold bg-surface-3 border border-border rounded-lg py-2 focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div className="text-text-muted font-bold pt-8">VS</div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <label className="font-semibold text-text-primary truncate max-w-full text-center" title={team2.team_name}>
                            {team2.team_name}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={team2Score}
                            onChange={e => setTeam2Score(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-20 text-center text-3xl font-bold bg-surface-3 border border-border rounded-lg py-2 focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                <div className="text-center text-sm text-text-muted border-t border-border pt-4">
                    Assign goals to specific players (Optional)
                </div>

                {/* Player Goals Assignment */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {renderPlayerList(team1Players, team1.team_name, team1Score, team1.id)}
                    {renderPlayerList(team2Players, team2.team_name, team2Score, team2.id)}
                </div>

                <div className="flex items-center gap-2 px-1 mt-2">
                    <input 
                        type="checkbox" 
                        id="mark_completed" 
                        checked={markCompleted} 
                        onChange={e => setMarkCompleted(e.target.checked)}
                        className="w-4 h-4 text-accent bg-surface-3 border-border rounded focus:ring-accent focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="mark_completed" className="text-sm font-medium text-text-primary cursor-pointer select-none">
                        Mark match as completed
                    </label>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Score'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

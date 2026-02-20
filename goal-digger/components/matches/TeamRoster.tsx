'use client'

import { useState, useCallback } from 'react'
import { saveTeamAssignments, resetTeams } from '../../app/actions/matches'
import { balanceTeams as runBalance } from '@goaldigger/core'
import { Button } from '../ui/Button'

interface SignupPlayer {
    player_id: string
    team: 1 | 2 | null
    profiles: {
        first_name: string
        last_name: string
        base_score: number
        goals: number
        player_position: string | null
    }
}

interface TeamRosterProps {
    matchId: string
    signups: SignupPlayer[]
    isAdmin: boolean
    matchStatus: string
}

function effectiveScore(p: { base_score: number; goals: number }) {
    return p.base_score + p.goals * 2
}

export function TeamRoster({ matchId, signups: initialSignups, isAdmin, matchStatus }: TeamRosterProps) {
    const [signups, setSignups] = useState<SignupPlayer[]>(initialSignups)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Track whether local state differs from what's saved in the DB
    const isDirty = signups.some((s, i) => s.team !== initialSignups[i]?.team)

    const team1 = signups.filter((s) => s.team === 1)
    const team2 = signups.filter((s) => s.team === 2)
    const hasTeams = team1.length > 0 || team2.length > 0

    const team1Score = team1.reduce((sum, s) => sum + effectiveScore(s.profiles), 0)
    const team2Score = team2.reduce((sum, s) => sum + effectiveScore(s.profiles), 0)
    const scoreDiff = Math.abs(team1Score - team2Score)

    /* ── Balance (client-side only) ── */
    const handleBalance = useCallback(() => {
        const playersForBalance = signups.map((s) => ({
            id: s.player_id,
            base_score: s.profiles.base_score,
            goals: s.profiles.goals,
        }))

        const { team1: t1Ids, team2: t2Ids } = runBalance(playersForBalance)

        setSignups((prev) =>
            prev.map((s) => ({
                ...s,
                team: t1Ids.includes(s.player_id) ? 1 as const : t2Ids.includes(s.player_id) ? 2 as const : s.team,
            }))
        )
        setError(null)
    }, [signups])

    /* ── Undo — resets DB: clears teams, sets status to open ── */
    const handleUndo = useCallback(async () => {
        setResetting(true)
        setError(null)
        try {
            await resetTeams(matchId)
            // Also reset local state so UI immediately shows the unbalanced list
            setSignups((prev) => prev.map((s) => ({ ...s, team: null })))
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to reset teams')
        } finally {
            setResetting(false)
        }
    }, [matchId])

    /* ── Save all assignments to DB ── */
    const handleSave = useCallback(async () => {
        const assignments = signups
            .filter((s) => s.team !== null)
            .map((s) => ({ playerId: s.player_id, team: s.team as 1 | 2 }))

        if (assignments.length < 2) {
            setError('Need at least 2 players assigned to teams')
            return
        }

        setSaving(true)
        setError(null)
        try {
            await saveTeamAssignments(matchId, assignments)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }, [signups, matchId])

    /* ── Drag & Drop (local state only) ── */
    const handleDragStart = useCallback((playerId: string) => {
        setDraggedId(playerId)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }, [])

    const handleDrop = useCallback((targetTeam: 1 | 2) => {
        if (!draggedId) return
        const player = signups.find((s) => s.player_id === draggedId)
        if (!player || player.team === targetTeam) {
            setDraggedId(null)
            return
        }

        setSignups((prev) =>
            prev.map((s) =>
                s.player_id === draggedId ? { ...s, team: targetTeam } : s
            )
        )
        setDraggedId(null)
    }, [draggedId, signups])

    return (
        <div className="flex flex-col gap-4">
            {/* Admin toolbar */}
            {isAdmin && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Balance button — always available for admin if ≥ 2 players */}
                        {signups.length >= 2 && (
                            <Button onClick={handleBalance} variant="secondary" size="sm">
                                ⚖️ Balance Teams
                            </Button>
                        )}

                        {/* Undo — resets DB and goes back to open state */}
                        {hasTeams && (
                            <Button onClick={handleUndo} isLoading={resetting} variant="danger" size="sm">
                                ↩ Undo Balance
                            </Button>
                        )}

                        {/* Save — persists to DB */}
                        {isDirty && (
                            <Button onClick={handleSave} isLoading={saving} size="sm">
                                💾 Save Teams
                            </Button>
                        )}
                    </div>

                    {hasTeams && (
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-text-muted">
                                Diff: <span className={`font-bold ${scoreDiff <= 5 ? 'text-success' : scoreDiff <= 15 ? 'text-warning' : 'text-danger'}`}>{scoreDiff}</span>
                            </p>
                            {isDirty && (
                                <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                                    Unsaved
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            {/* Team columns or single list */}
            {hasTeams ? (
                <>
                    {isAdmin && <p className="text-xs text-text-muted italic">Drag players between teams to adjust</p>}
                    <div className="grid gap-4 md:grid-cols-2">
                        <TeamColumn
                            title="Team 1"
                            team={1}
                            players={team1}
                            score={team1Score}
                            color="accent"
                            isAdmin={isAdmin}
                            draggedId={draggedId}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                        <TeamColumn
                            title="Team 2"
                            team={2}
                            players={team2}
                            score={team2Score}
                            color="warning"
                            isAdmin={isAdmin}
                            draggedId={draggedId}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    </div>
                </>
            ) : (
                /* Pre-balance: just list the players */
                <div className="rounded-xl border border-border">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="font-semibold text-text-primary">
                            Signed-Up Players ({signups.length})
                        </h2>
                    </div>
                    {signups.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {signups.map((s) => (
                                <PlayerRow key={s.player_id} signup={s} />
                            ))}
                        </ul>
                    ) : (
                        <p className="px-5 py-8 text-center text-sm text-text-muted">
                            No players have joined yet. Be the first! 🎯
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Team Column (drop zone) ── */

interface TeamColumnProps {
    title: string
    team: 1 | 2
    players: SignupPlayer[]
    score: number
    color: string
    isAdmin: boolean
    draggedId: string | null
    onDragStart: (id: string) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (team: 1 | 2) => void
}

function TeamColumn({ title, team, players, score, color, isAdmin, draggedId, onDragStart, onDragOver, onDrop }: TeamColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false)

    const borderColor = color === 'accent' ? 'border-accent/40' : 'border-warning/40'
    const headerBg = color === 'accent' ? 'bg-accent/10' : 'bg-warning/10'
    const headerText = color === 'accent' ? 'text-accent' : 'text-warning'
    const dropHighlight = isDragOver ? (color === 'accent' ? 'ring-2 ring-accent/50' : 'ring-2 ring-warning/50') : ''

    return (
        <div
            className={`rounded-xl border ${borderColor} ${dropHighlight} transition-all duration-200`}
            onDragOver={(e) => {
                onDragOver(e)
                setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                onDrop(team)
            }}
        >
            <div className={`flex items-center justify-between px-5 py-3 ${headerBg} rounded-t-xl border-b ${borderColor}`}>
                <h3 className={`font-bold ${headerText}`}>{title}</h3>
                <span className="text-xs text-text-muted font-mono">
                    Score: {score} · {players.length} players
                </span>
            </div>
            {players.length > 0 ? (
                <ul className="divide-y divide-border">
                    {players.map((s) => (
                        <DraggablePlayer
                            key={s.player_id}
                            signup={s}
                            isAdmin={isAdmin}
                            isDragging={draggedId === s.player_id}
                            onDragStart={onDragStart}
                        />
                    ))}
                </ul>
            ) : (
                <p className="px-5 py-6 text-center text-sm text-text-muted">
                    {isAdmin ? 'Drop players here' : 'No players'}
                </p>
            )}
        </div>
    )
}

/* ── Draggable Player Row ── */

function DraggablePlayer({ signup, isAdmin, isDragging, onDragStart }: {
    signup: SignupPlayer
    isAdmin: boolean
    isDragging: boolean
    onDragStart: (id: string) => void
}) {
    const p = signup.profiles
    const score = effectiveScore(p)

    return (
        <li
            draggable={isAdmin}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                onDragStart(signup.player_id)
            }}
            className={`flex items-center justify-between px-5 py-3 transition-all duration-150 ${isAdmin ? 'cursor-grab active:cursor-grabbing hover:bg-surface-3' : ''
                } ${isDragging ? 'opacity-40 scale-95' : ''}`}
        >
            <div className="flex items-center gap-3">
                {isAdmin && (
                    <span className="text-text-muted text-xs select-none">⠿</span>
                )}
                <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-text-muted">
                    {p.first_name?.[0]}{p.last_name?.[0]}
                </div>
                <div>
                    <p className="text-sm font-medium text-text-primary">
                        {p.first_name} {p.last_name}
                    </p>
                    {p.player_position && (
                        <p className="text-xs text-text-muted capitalize">{p.player_position}</p>
                    )}
                </div>
            </div>
            <span className="font-mono text-sm font-bold text-accent">{score}</span>
        </li>
    )
}

/* ── Simple Player Row (pre-balance list) ── */

function PlayerRow({ signup }: { signup: SignupPlayer }) {
    const p = signup.profiles
    const score = effectiveScore(p)

    return (
        <li className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-text-muted">
                    {p.first_name?.[0]}{p.last_name?.[0]}
                </div>
                <div>
                    <p className="text-sm font-medium text-text-primary">
                        {p.first_name} {p.last_name}
                    </p>
                    {p.player_position && (
                        <p className="text-xs text-text-muted capitalize">{p.player_position}</p>
                    )}
                </div>
            </div>
            <span className="font-mono text-sm font-bold text-accent">{score}</span>
        </li>
    )
}

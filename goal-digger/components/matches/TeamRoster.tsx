'use client'

import { useState, useCallback, useEffect } from 'react'
import { saveTeamAssignments, resetTeams, togglePaidStatus } from '../../app/actions/matches'
import { balanceTeams as runBalance } from '@goaldigger/core'
import { ManageMatchPlayersModal } from './ManageMatchPlayersModal'
import { MatchActionMenu } from './MatchActionMenu'
import { SendInvitationsModal } from './SendInvitationsModal'
import { SendMatchCostModal } from './SendMatchCostModal'
import { ManageDeclinedPlayersModal } from './ManageDeclinedPlayersModal'
import { SendRosterModal } from './SendRosterModal'
import { useToast } from '../providers/ToastProvider'

interface SignupPlayer {
    player_id: string
    team: 1 | 2 | null
    paid?: boolean
    profiles: {
        first_name: string
        last_name: string
        nickname?: string | null
        base_score: number
        goals: number
        player_position: string | null
        avatar_url: string | null
        peer_rating_score?: number | null
    }
}

interface TeamRosterProps {
    matchId: string
    scheduledAt: string
    signups: SignupPlayer[]
    notComingSignups?: SignupPlayer[]
    allPlayers: any[]
    isAdmin: boolean
}

function effectiveScore(p: { base_score: number; goals: number }) {
    return p.base_score + p.goals * 2
}

function abbrevPos(pos: string) {
    switch (pos.toLowerCase()) {
        case 'striker': return 'STK'
        case 'midfielder': return 'MID'
        case 'defender': return 'DEF'
        case 'goalkeeper': return 'GK'
        default: return pos.substring(0, 3).toUpperCase()
    }
}

export function TeamRoster({ matchId, scheduledAt, signups: initialSignups, notComingSignups = [], allPlayers, isAdmin }: TeamRosterProps) {
    const [signups, setSignups] = useState<SignupPlayer[]>(initialSignups)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false)
    const [isManageDeclinedOpen, setIsManageDeclinedOpen] = useState(false)
    const [isInvitationsOpen, setIsInvitationsOpen] = useState(false)
    const [isCostsOpen, setIsCostsOpen] = useState(false)
    const [isSendRosterOpen, setIsSendRosterOpen] = useState(false)

    const toast = useToast()

    // Track whether local state differs from what's saved in the DB
    const isDirty = signups.some((s) => {
        const initial = initialSignups.find(u => u.player_id === s.player_id)
        return s.team !== (initial?.team ?? null)
    })

    // Safely sync server properties (like updated `paid` toggles) while preserving un-saved drag distributions
    useEffect(() => {
        setSignups(prev => {
            return initialSignups.map(serverS => {
                const localS = prev.find(p => p.player_id === serverS.player_id)
                return {
                    ...serverS,
                    team: localS ? localS.team : serverS.team,
                }
            })
        })
    }, [initialSignups])

    const team1 = signups.filter((s) => s.team === 1)
    const team2 = signups.filter((s) => s.team === 2)
    const hasTeams = team1.length > 0 || team2.length > 0

    const getScoreVal = (s: SignupPlayer) => s.profiles.peer_rating_score ?? effectiveScore(s.profiles)

    const team1ScoreRaw = team1.reduce((sum, s) => sum + getScoreVal(s), 0)
    const team2ScoreRaw = team2.reduce((sum, s) => sum + getScoreVal(s), 0)
    const team1Score = Number(team1ScoreRaw.toFixed(2))
    const team2Score = Number(team2ScoreRaw.toFixed(2))
    const scoreDiff = Number(Math.abs(team1ScoreRaw - team2ScoreRaw).toFixed(2))

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

    /* ── Copy Players to Clipboard ── */
    const handleCopyPlayers = useCallback(async () => {
        const date = new Date(scheduledAt)
        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' })
        const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })

        let msg = `Soccer this ${dayName} at ${time}. Please Put your name if you are interested.\n`
        signups.forEach((s, index) => {
            const name = s.profiles.nickname || `${s.profiles.first_name} ${s.profiles.last_name}`
            msg += `${index + 1}. ${name}\n`
        })

        try {
            await navigator.clipboard.writeText(msg.trim())
            toast.success('Roster copied to clipboard!')
        } catch (err) {
            console.error('Failed to copy roster', err)
            toast.error('Failed to copy roster')
        }
    }, [scheduledAt, signups, toast])

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
        <div className="flex flex-col gap-5">
            {/* Admin toolbar */}
            {isAdmin && hasTeams && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 sm:justify-center">
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
                    
                    <div className="flex items-center gap-1 border-l border-border pl-3">
                        <button 
                            onClick={handleUndo} 
                            disabled={resetting}
                            title="Undo Balance"
                            className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                            {resetting ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                            )}
                        </button>
                        
                        {isDirty && (
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                title="Save Teams"
                                className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => setIsSendRosterOpen(true)}
                            disabled={isDirty}
                            title={isDirty ? "Save teams before broadcasting" : "Broadcast Team Roster"}
                            className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </button>
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            {/* Team columns or single list */}
            {hasTeams ? (
                <>
                    {isAdmin && <p className="text-xs text-text-muted italic">Drag players between teams to adjust</p>}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-4">
                        <TeamColumn
                            title="Team 1"
                            team={1}
                            players={team1}
                            score={team1Score}
                            color="accent"
                            isAdmin={isAdmin}
                            matchId={matchId}
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
                            matchId={matchId}
                            draggedId={draggedId}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    </div>
                </>
            ) : (
                /* Pre-balance: just list the players */
                <div className="rounded-xl border border-border bg-surface-2">
                    <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Confirmed roster</p>
                            <h2 className="mt-1 font-semibold text-text-primary">Signed-up players <span className="text-text-muted">({signups.length})</span></h2>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-1">
                                {signups.length >= 2 && !hasTeams && (
                                    <button
                                        onClick={handleBalance}
                                        title="Balance Teams"
                                        className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-accent hover:bg-surface-3 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                                    </button>
                                )}
                                <button
                                    onClick={handleCopyPlayers}
                                    title="Copy signed up players to clipboard"
                                    className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-accent hover:bg-surface-3 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                                <MatchActionMenu
                                    onManage={() => setIsManagePlayersOpen(true)}
                                    onInvite={() => setIsInvitationsOpen(true)}
                                    onCost={() => setIsCostsOpen(true)}
                                />
                            </div>
                        )}
                    </div>
                    {signups.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {signups.map((s) => (
                                <PlayerRow key={s.player_id} signup={s} isAdmin={isAdmin} matchId={matchId} />
                            ))}
                        </ul>
                    ) : (
                        <p className="px-5 py-8 text-center text-sm text-text-muted">
                            No players have joined yet. Be the first to sign up.
                        </p>
                    )}
                </div>
            )}

            {/* Manage Declined Players Modal */}
            {isManageDeclinedOpen && (
                <ManageDeclinedPlayersModal
                    matchId={matchId}
                    allPlayers={allPlayers}
                    initialDeclinedIds={notComingSignups.map((s) => s.player_id)}
                    onClose={() => setIsManageDeclinedOpen(false)}
                />
            )}

            {/* Not Coming Section */}
            {(notComingSignups.length > 0 || isAdmin) && (
                <div className="mt-1 rounded-xl border border-border bg-surface-2">
                    <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Unavailable</p>
                                <h2 className="mt-1 font-semibold text-text-primary">Can&apos;t make it <span className="text-text-muted">({notComingSignups.length})</span></h2>
                            </div>
                        </div>
                        {isAdmin && (
                            <MatchActionMenu
                                onManage={() => setIsManageDeclinedOpen(true)}
                            />
                        )}
                    </div>
                    {notComingSignups.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {notComingSignups.map((s) => {
                                const p = s.profiles
                                return (
                                    <li key={s.player_id} className="flex items-center gap-3 px-5 py-3 opacity-60">
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover grayscale" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                                                {p.first_name?.[0]}{p.last_name?.[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text-muted line-through">
                                                {p.nickname || `${p.first_name} ${p.last_name}`}
                                            </p>
                                            {p.player_position && (
                                                <p className="text-xs text-text-muted capitalize">{p.player_position}</p>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <p className="px-5 py-8 text-center text-sm text-text-muted">
                            No one has declined yet.
                        </p>
                    )}
                </div>
            )}

            {isManagePlayersOpen && (
                <ManageMatchPlayersModal
                    matchId={matchId}
                    scheduledAt={scheduledAt}
                    allPlayers={allPlayers}
                    initialAssignedIds={initialSignups.map(s => s.player_id)}
                    onClose={() => setIsManagePlayersOpen(false)}
                />
            )}

            {isInvitationsOpen && (
                <SendInvitationsModal
                    matchId={matchId}
                    scheduledAt={scheduledAt}
                    allPlayers={allPlayers}
                    signedInIds={signups.map(s => s.player_id)}
                    declinedIds={notComingSignups.map(s => s.player_id)}
                    onClose={() => setIsInvitationsOpen(false)}
                />
            )}

            {isCostsOpen && (
                <SendMatchCostModal
                    matchId={matchId}
                    scheduledAt={scheduledAt}
                    signups={signups}
                    onClose={() => setIsCostsOpen(false)}
                />
            )}

            {isSendRosterOpen && (
                <SendRosterModal
                    matchId={matchId}
                    scheduledAt={scheduledAt}
                    team1Ids={team1.map(s => s.player_id)}
                    team2Ids={team2.map(s => s.player_id)}
                    team1List={team1.map(s => ({
                        id: s.player_id,
                        name: s.profiles.nickname || `${s.profiles.first_name} ${s.profiles.last_name}`,
                        pos: s.profiles.player_position || ''
                    }))}
                    team2List={team2.map(s => ({
                        id: s.player_id,
                        name: s.profiles.nickname || `${s.profiles.first_name} ${s.profiles.last_name}`,
                        pos: s.profiles.player_position || ''
                    }))}
                    onClose={() => setIsSendRosterOpen(false)}
                />
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
    matchId: string
    draggedId: string | null
    onDragStart: (id: string) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (team: 1 | 2) => void
}

function TeamColumn({ title, team, players, score, color, isAdmin, matchId, draggedId, onDragStart, onDragOver, onDrop }: TeamColumnProps) {
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
            <div className={`flex flex-col sm:flex-row items-center justify-between px-2 sm:px-5 py-2 sm:py-3 ${headerBg} rounded-t-xl border-b ${borderColor}`}>
                <h3 className={`font-bold text-xs sm:text-base ${headerText}`}>{title}</h3>
                <span className="text-[10px] sm:text-xs text-text-muted font-mono whitespace-nowrap">
                    Score: <span className="font-bold">{score}</span> · {players.length}
                </span>
            </div>
            {players.length > 0 ? (
                <ul className="divide-y divide-border">
                    {players.map((s) => (
                        <DraggablePlayer
                            key={s.player_id}
                            signup={s}
                            isAdmin={isAdmin}
                            matchId={matchId}
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

function DraggablePlayer({ signup, isAdmin, matchId, isDragging, onDragStart }: {
    signup: SignupPlayer
    isAdmin: boolean
    matchId: string
    isDragging: boolean
    onDragStart: (id: string) => void
}) {
    const p = signup.profiles
    const scoreVal = p.peer_rating_score ?? effectiveScore(p)
    const score = p.peer_rating_score !== null && p.peer_rating_score !== undefined ? Number(p.peer_rating_score).toFixed(1) : scoreVal.toFixed(1)
    const [isUpdating, setIsUpdating] = useState(false)
    const [optimisticPaid, setOptimisticPaid] = useState(signup.paid)
    const toast = useToast()

    useEffect(() => {
        setOptimisticPaid(signup.paid)
    }, [signup.paid])

    async function handleTogglePaid() {
        if (!isAdmin || isUpdating) return

        setIsUpdating(true)
        const nextState = !optimisticPaid
        setOptimisticPaid(nextState)

        try {
            await togglePaidStatus(matchId, signup.player_id, nextState)
        } catch (err: unknown) {
            setOptimisticPaid(!nextState)
            toast.error('Failed to update paid status')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <li
            draggable={isAdmin}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                onDragStart(signup.player_id)
            }}
            className={`flex items-center justify-between gap-1.5 px-1.5 sm:px-5 py-2 sm:py-3 transition-all duration-150 ${isAdmin ? 'cursor-grab active:cursor-grabbing hover:bg-surface-3' : ''
                } ${isDragging ? 'opacity-40 scale-95' : ''}`}
        >
            <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                {isAdmin && (
                    <span className="text-text-muted text-[10px] sm:text-xs select-none -mr-1 sm:mr-0 sm:pr-1">⠿</span>
                )}
                {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-3 flex items-center justify-center text-[10px] sm:text-xs font-bold text-text-muted flex-shrink-0">
                        {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-sm font-medium text-text-primary truncate">
                        {p.nickname || `${p.first_name} ${p.last_name}`}
                    </p>
                    <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] text-text-muted truncate">
                        {p.player_position && <span className="font-medium tracking-wide">{abbrevPos(p.player_position)}</span>}
                        {p.player_position && score !== '-' && <span className="opacity-50">•</span>}
                        <span className="font-mono text-accent font-medium">{score}</span>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0">
                {isAdmin ? (
                    <button
                        onClick={handleTogglePaid}
                        disabled={isUpdating}
                        className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded border transition-colors ${optimisticPaid
                            ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20'
                            : 'bg-surface-3 text-text-muted border-border hover:bg-surface-4'
                            }`}
                        title="Toggle Paid Status"
                    >
                        {optimisticPaid ? 'PAID' : 'UNPAID'}
                    </button>
                ) : optimisticPaid && (
                    <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/30">
                        PAID
                    </span>
                )}
            </div>
        </li>
    )
}

/* ── Simple Player Row (pre-balance list) ── */

function PlayerRow({ signup, isAdmin, matchId }: { signup: SignupPlayer, isAdmin: boolean, matchId: string }) {
    const p = signup.profiles
    const scoreVal = p.peer_rating_score ?? effectiveScore(p)
    const score = p.peer_rating_score !== null && p.peer_rating_score !== undefined ? Number(p.peer_rating_score).toFixed(1) : scoreVal.toFixed(1)
    const [isUpdating, setIsUpdating] = useState(false)
    const [optimisticPaid, setOptimisticPaid] = useState(signup.paid)
    const toast = useToast()

    useEffect(() => {
        setOptimisticPaid(signup.paid)
    }, [signup.paid])

    async function handleTogglePaid() {
        if (!isAdmin || isUpdating) return

        setIsUpdating(true)
        const nextState = !optimisticPaid
        setOptimisticPaid(nextState)

        try {
            await togglePaidStatus(matchId, signup.player_id, nextState)
        } catch (err: unknown) {
            setOptimisticPaid(!nextState)
            toast.error('Failed to update paid status')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <li className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
                {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
                        {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                )}
                <div>
                    <p className="text-sm font-medium text-text-primary">
                        {p.nickname || `${p.first_name} ${p.last_name}`}
                    </p>
                    {p.player_position && (
                        <p className="text-xs text-text-muted capitalize">{p.player_position}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-accent">{score}</span>
                {isAdmin ? (
                    <button
                        onClick={handleTogglePaid}
                        disabled={isUpdating}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${optimisticPaid
                                ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20'
                                : 'bg-surface-3 text-text-muted border-border hover:bg-surface-4'
                            }`}
                        title="Toggle Paid Status"
                    >
                        {optimisticPaid ? 'PAID' : 'UNPAID'}
                    </button>
                ) : optimisticPaid && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/30">
                        PAID
                    </span>
                )}
            </div>
        </li>
    )
}

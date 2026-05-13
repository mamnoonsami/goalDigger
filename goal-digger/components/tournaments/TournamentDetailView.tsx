'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../ui/Card'
import { TournamentStatusBadge } from './TournamentStatusBadge'
import { TournamentDetailActions } from './TournamentDetailActions'
import { EditTournamentModal } from './EditTournamentModal'
import { Button } from '../ui/Button'
import { deleteAllTournamentMatches, deleteTournamentMatch, joinTournament, leaveTournament, markTournamentMatchAsFinal, unmarkTournamentMatchAsFinal } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'
import { AddPlayersModal } from './AddPlayersModal'
import { CreateTeamModal } from './CreateTeamModal'
import { ManageTeamsModal } from './ManageTeamsModal'
import { EditTeamModal } from './EditTeamModal'
import { AssignPlayersToTeamModal } from './AssignPlayersToTeamModal'
import { CreateTournamentMatchModal } from './CreateTournamentMatchModal'
import { RecordMatchScoreModal } from './RecordMatchScoreModal'

interface Auction {
    id: string
    title: string
    status: string
}

interface Team {
    id: string
    team_name: string
    team_slogan: string | null
    number_of_players: number
    manager_id: string | null
    logo_url?: string | null
    profiles: { first_name: string; last_name: string; avatar_url: string | null } | { first_name: string; last_name: string; avatar_url: string | null }[] | null
}

interface TournamentPlayer {
    id: string
    player_id: string
    team_id: string | null
    profiles: { first_name: string; last_name: string; player_position: string | null; avatar_url: string | null } | { first_name: string; last_name: string; player_position: string | null; avatar_url: string | null }[]
    tournament_teams: { team_name: string } | { team_name: string }[] | null
}

interface Tournament {
    id: string
    name: string
    description: string | null
    status: string
    auction_id: string | null
    start_date: string | null
    end_date: string | null
    location: string | null
    created_at: string
    updated_at: string
}

interface TournamentMatch {
    id: string
    tournament_id: string
    team_1_id: string
    team_2_id: string
    team_1_score: number | string | null
    team_2_score: number | string | null
    match_date: string
    status: string
    is_final?: boolean | null
}

interface TournamentMatchStat {
    tournament_match_id: string
    player_id: string
    team_id: string
    goals: number
    assists?: number | null
}

interface FixtureMatchRow {
    type: 'match'
    id: string
    time: string
    team1Name: string
    team2Name: string
    score: string
    winner: string
    isCompleted: boolean
    isFinal: boolean
}

interface FixtureFinalRow {
    type: 'final'
    id: 'final'
    time: 'TBD'
    match: 'Top 2 teams from leaderboard'
    score: '-'
    winner: '-'
    isCompleted: false
    isFinal: true
}

type FixtureRow = FixtureMatchRow | FixtureFinalRow

interface Props {
    tournament: Tournament
    teams: Team[]
    players: TournamentPlayer[]
    matches?: TournamentMatch[]
    matchStats?: TournamentMatchStat[]
    linkedAuction: { id: string; title: string; status: string } | null
    allAuctions: Auction[]
    allDbPlayers?: { id: string; first_name: string; last_name: string; player_position: string | null; base_score: number; is_guest?: boolean }[]
    isAdmin: boolean
    isPlayer?: boolean
    isManager?: boolean
    hasJoined?: boolean
    currentUserId?: string | null
}

function matchScoreOrZero(score: unknown) {
    if (score === null || score === undefined || score === '') return 0

    const numericScore = Number(score)
    return Number.isFinite(numericScore) ? numericScore : 0
}

function formatFixtureTime(matchDate: string) {
    return new Date(matchDate).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

export function TournamentDetailView({ tournament, teams, players, matches = [], matchStats = [], linkedAuction, allAuctions, allDbPlayers = [], isAdmin, isPlayer = false, isManager = false, hasJoined = false, currentUserId = null }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isAddPlayersOpen, setIsAddPlayersOpen] = useState(false)
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
    const [isManageTeamsOpen, setIsManageTeamsOpen] = useState(false)
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
    const [assigningTeamId, setAssigningTeamId] = useState<string | null>(null)
    const [viewingTeamPlayersId, setViewingTeamPlayersId] = useState<string | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [leaderboardTab, setLeaderboardTab] = useState<'players' | 'teams' | 'matches'>('teams')
    const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false)
    const [recordScoreMatchId, setRecordScoreMatchId] = useState<string | null>(null)
    const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null)
    const [showDeleteAllMatchesConfirm, setShowDeleteAllMatchesConfirm] = useState(false)
    const [isDeletingMatch, setIsDeletingMatch] = useState(false)
    const [matchActionMenuId, setMatchActionMenuId] = useState<string | null>(null)
    const [finalMatchConfirmId, setFinalMatchConfirmId] = useState<string | null>(null)
    const [unmarkFinalConfirmId, setUnmarkFinalConfirmId] = useState<string | null>(null)
    const [isMarkingFinal, setIsMarkingFinal] = useState(false)

    // Compute stats
    const completedMatches = matches.filter(m => m.status === 'completed')
    const displayMatches = [...matches].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (a.status !== 'completed' && b.status === 'completed') return -1

        return new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    })

    const unsortedTeamStats = teams.map(team => {
        const teamMatches = completedMatches.filter(m => m.team_1_id === team.id || m.team_2_id === team.id)
        let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
        teamMatches.forEach(m => {
            const isTeam1 = m.team_1_id === team.id
            const myScore = matchScoreOrZero(isTeam1 ? m.team_1_score : m.team_2_score)
            const theirScore = matchScoreOrZero(isTeam1 ? m.team_2_score : m.team_1_score)
            gf += myScore
            ga += theirScore
            if (myScore > theirScore) won++
            else if (myScore === theirScore) drawn++
            else lost++
        })
        const gd = gf - ga
        const points = won * 3 + drawn * 1
        return { ...team, played: teamMatches.length, won, drawn, lost, gf, ga, gd, points }
    })

    function getHeadToHeadPoints(teamId: string, tiedTeamIds: string[]) {
        return completedMatches.reduce((points, match) => {
            const isTeam1 = match.team_1_id === teamId
            const isTeam2 = match.team_2_id === teamId
            if (!isTeam1 && !isTeam2) return points

            const opponentId = isTeam1 ? match.team_2_id : match.team_1_id
            if (!tiedTeamIds.includes(opponentId)) return points

            const myScore = matchScoreOrZero(isTeam1 ? match.team_1_score : match.team_2_score)
            const theirScore = matchScoreOrZero(isTeam1 ? match.team_2_score : match.team_1_score)

            if (myScore > theirScore) return points + 3
            if (myScore === theirScore) return points + 1
            return points
        }, 0)
    }

    const teamStats = [...unsortedTeamStats].sort((a, b) => {
        const standingDifference = b.points - a.points || b.gd - a.gd || b.gf - a.gf
        if (standingDifference !== 0) return standingDifference

        const tiedTeamIds = unsortedTeamStats
            .filter(team => team.points === a.points && team.gd === a.gd && team.gf === a.gf)
            .map(team => team.id)

        return getHeadToHeadPoints(b.id, tiedTeamIds) - getHeadToHeadPoints(a.id, tiedTeamIds)
            || a.team_name.localeCompare(b.team_name)
    })

    const playerStats = players.map(player => {
        const pStats = matchStats.filter(ms => ms.player_id === player.player_id)
        const goals = pStats.reduce((acc, curr) => acc + curr.goals, 0)
        const assists = pStats.reduce((acc, curr) => acc + (curr.assists || 0), 0)
        const team = teams.find(t => t.id === player.team_id)
        const matchesPlayed = team ? completedMatches.filter(m => m.team_1_id === team.id || m.team_2_id === team.id).length : 0
        return { ...player, goals, assists, matchesPlayed }
    }).sort((a, b) => {
        const goalOrAssistDifference = b.goals - a.goals || b.assists - a.assists
        if (goalOrAssistDifference !== 0) return goalOrAssistDifference

        const aProfile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
        const bProfile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
        return `${aProfile?.first_name ?? ''} ${aProfile?.last_name ?? ''}`.localeCompare(`${bProfile?.first_name ?? ''} ${bProfile?.last_name ?? ''}`)
    })

    const finalMatch = matches.find(match => match.is_final)
    const normalFixtureMatches = matches
        .filter(match => !match.is_final)
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

    function getFixtureMatchRow(match: TournamentMatch): FixtureMatchRow {
        const team1 = teams.find(team => team.id === match.team_1_id)
        const team2 = teams.find(team => team.id === match.team_2_id)
        const team1Score = matchScoreOrZero(match.team_1_score)
        const team2Score = matchScoreOrZero(match.team_2_score)
        const isCompleted = match.status === 'completed'
        const winner = !isCompleted
            ? '-'
            : team1Score > team2Score
                ? team1?.team_name ?? 'Team 1'
                : team2Score > team1Score
                    ? team2?.team_name ?? 'Team 2'
                    : '-'

        return {
            type: 'match',
            id: match.id,
            time: formatFixtureTime(match.match_date),
            team1Name: team1?.team_name ?? 'Unknown',
            team2Name: team2?.team_name ?? 'Unknown',
            score: isCompleted ? `${team1Score} - ${team2Score}` : '-',
            winner,
            isCompleted,
            isFinal: !!match.is_final,
        }
    }

    const orderedFixtureRows: FixtureRow[] = [
        ...(finalMatch ? [getFixtureMatchRow(finalMatch)] : []),
        ...normalFixtureMatches.map(getFixtureMatchRow),
        ...(matches.length > 0 && !finalMatch
            ? [{ type: 'final', id: 'final', time: 'TBD', match: 'Top 2 teams from leaderboard', score: '-', winner: '-', isCompleted: false, isFinal: true } as FixtureFinalRow]
            : []),
    ]

    async function handleMarkFinalMatch() {
        if (!finalMatchConfirmId) return

        setIsMarkingFinal(true)
        try {
            await markTournamentMatchAsFinal(tournament.id, finalMatchConfirmId)
            toast.success('Final match marked')
            setFinalMatchConfirmId(null)
            setMatchActionMenuId(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to mark final match')
        } finally {
            setIsMarkingFinal(false)
        }
    }

    async function handleUnmarkFinalMatch() {
        if (!unmarkFinalConfirmId) return

        setIsMarkingFinal(true)
        try {
            await unmarkTournamentMatchAsFinal(tournament.id, unmarkFinalConfirmId)
            toast.success('Final match removed')
            setUnmarkFinalConfirmId(null)
            setMatchActionMenuId(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove final match')
        } finally {
            setIsMarkingFinal(false)
        }
    }

    async function handleDeleteMatch() {
        if (!deleteMatchId) return

        setIsDeletingMatch(true)
        try {
            await deleteTournamentMatch(tournament.id, deleteMatchId)
            toast.success('Match deleted')
            setDeleteMatchId(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete match')
        } finally {
            setIsDeletingMatch(false)
        }
    }

    async function handleDeleteAllMatches() {
        setIsDeletingMatch(true)
        try {
            await deleteAllTournamentMatches(tournament.id)
            toast.success('All matches deleted')
            setShowDeleteAllMatchesConfirm(false)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete matches')
        } finally {
            setIsDeletingMatch(false)
        }
    }

    

    return (
        <div className="flex flex-col gap-6 overflow-hidden">
            {/* Tournament Header Card */}
            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1 rounded hover:bg-surface-3 text-text-muted transition-colors flex items-center justify-center flex-shrink-0"
                                    title={isMinimized ? "Expand Details" : "Minimize Details"}
                                >
                                    {isMinimized ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    )}
                                </button>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-2xl font-bold text-text-primary truncate">{tournament.name}</h1>
                                </div>
                                <div className="hidden sm:block">
                                    <TournamentStatusBadge status={tournament.status} />
                                </div>
                            </div>

                            {/* Desktop actions */}
                            <div className="hidden sm:flex items-center gap-2">
                                {isPlayer && tournament.status !== 'completed' && (
                                    <>
                                        {hasJoined ? (
                                            <Button variant="ghost" size="sm" onClick={async () => { setIsProcessing(true); try { await leaveTournament(tournament.id); toast.warning('Left the tournament'); router.refresh() } catch { toast.error('Failed to leave tournament') } finally { setIsProcessing(false) } }} disabled={isProcessing} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8">
                                                {isProcessing ? 'Leaving...' : 'Leave'}
                                            </Button>
                                        ) : (
                                            <Button variant="primary" size="sm" onClick={async () => { setIsProcessing(true); try { await joinTournament(tournament.id); toast.success('Joined tournament!'); router.refresh() } catch { toast.error('Failed to join tournament') } finally { setIsProcessing(false) } }} disabled={isProcessing} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0 h-8 px-4">
                                                {isProcessing ? 'Joining...' : 'Join'}
                                            </Button>
                                        )}
                                    </>
                                )}
                                {isAdmin && (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="text-accent hover:text-accent-hover hover:bg-accent/10" title="Edit Tournament">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                                        </Button>
                                        <TournamentDetailActions tournamentId={tournament.id} />
                                    </>
                                )}
                            </div>

                            {/* Mobile 3-dot menu */}
                            {((isPlayer && tournament.status !== 'completed') || isAdmin) && (
                                <div className="relative sm:hidden">
                                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 rounded-lg hover:bg-surface-3 text-text-muted transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                                    </button>
                                    {mobileMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                                            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-surface-2 shadow-xl py-1">
                                                {isPlayer && tournament.status !== 'completed' && (
                                                    hasJoined ? (
                                                        <button onClick={async () => { setMobileMenuOpen(false); setIsProcessing(true); try { await leaveTournament(tournament.id); toast.warning('Left the tournament'); router.refresh() } catch { toast.error('Failed to leave tournament') } finally { setIsProcessing(false) } }} disabled={isProcessing} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-3 transition-colors">
                                                            Leave Tournament
                                                        </button>
                                                    ) : (
                                                        <button onClick={async () => { setMobileMenuOpen(false); setIsProcessing(true); try { await joinTournament(tournament.id); toast.success('Joined tournament!'); router.refresh() } catch { toast.error('Failed to join tournament') } finally { setIsProcessing(false) } }} disabled={isProcessing} className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-surface-3 transition-colors">
                                                            Join Tournament
                                                        </button>
                                                    )
                                                )}
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => { setIsEditModalOpen(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-surface-3 transition-colors">
                                                            Edit Tournament
                                                        </button>
                                                        <div className="border-t border-border my-1" />
                                                        <TournamentDetailActions tournamentId={tournament.id} variant="menu" />
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile status badge */}
                        <div className="sm:hidden mt-2 pl-8">
                            <TournamentStatusBadge status={tournament.status} />
                        </div>

                        {!isMinimized && (
                            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted pl-1 sm:pl-10">
                                {tournament.start_date && (
                                    <span className="flex items-center gap-1.5">
                                        📅 {new Date(tournament.start_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {tournament.end_date && tournament.end_date !== tournament.start_date
                                            ? ` – ${new Date(tournament.end_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                            : `, ${new Date(tournament.start_date + 'T00:00').getFullYear()}`
                                        }
                                    </span>
                                )}
                                {tournament.location && (
                                    <span className="flex items-center gap-1.5">📍 {tournament.location}</span>
                                )}
                                {linkedAuction && (
                                    <a href={`/auctions/${linkedAuction.id}`} className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors">
                                        🔨 {linkedAuction.title}
                                    </a>
                                )}
                                <span className="flex items-center gap-1.5">🏆 {teams.length} teams</span>
                                <span className="flex items-center gap-1.5">⚽ {players.length} players</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {!isMinimized && tournament.description && (
                    <div className="mt-4 text-sm text-text-muted pl-1 sm:pl-10">
                        <p className="whitespace-pre-wrap"><span className="text-text-primary mr-1">📋</span>{tournament.description}</p>
                    </div>
                )}

                {isEditModalOpen && (
                    <EditTournamentModal
                        tournament={{
                            id: tournament.id,
                            name: tournament.name,
                            description: tournament.description || '',
                            status: tournament.status,
                            auction_id: tournament.auction_id,
                            start_date: tournament.start_date,
                            end_date: tournament.end_date,
                            location: tournament.location,
                        }}
                        auctions={allAuctions}
                        onClose={() => setIsEditModalOpen(false)}
                    />
                )}
            </Card>

            {/* Teams Section */}
            {currentUserId && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-primary">🏆 Teams ({teams.length})</h3>
                        <div className="flex items-center gap-2">
                            {(isAdmin || isManager) && (
                                <Button
                                    size="sm"
                                    onClick={() => setIsCreateTeamOpen(true)}
                                    className="text-xs"
                                >
                                    + Create Team
                                </Button>
                            )}
                            {(isAdmin || isManager) && teams.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsManageTeamsOpen(true)}
                                    className="text-xs"
                                >
                                    Manage Teams
                                </Button>
                            )}
                        </div>
                    </div>
                    {teams.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 min-w-0">
                            {teams.map(team => {
                                const teamPlayers = players.filter(p => p.team_id === team.id)
                                const profile = Array.isArray(team.profiles) ? team.profiles[0] : team.profiles
                                return (
                                    <Card key={team.id}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {team.logo_url ? (
                                                    <img src={team.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center border border-border text-xs font-bold text-text-muted flex-shrink-0">
                                                        {team.team_name.substring(0,2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-text-primary truncate">{team.team_name}</h4>
                                                    {team.team_slogan && (
                                                        <p className="text-xs text-text-muted italic truncate">&ldquo;{team.team_slogan}&rdquo;</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-text-muted bg-surface-3 rounded-full px-2 py-0.5">
                                                    {teamPlayers.length} players
                                                </span>
                                                {(isAdmin || isManager) && (
                                                    <button
                                                        onClick={() => setEditingTeamId(team.id)}
                                                        className="p-1 rounded hover:bg-accent/10 text-accent hover:text-accent-hover transition-colors"
                                                        title="Edit Team"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {teamPlayers.length > 0 && (
                                            <div className="mt-2">
                                                <button 
                                                    onClick={() => setViewingTeamPlayersId(team.id)}
                                                    className="text-xs text-accent hover:text-accent-hover transition-colors font-medium mb-2"
                                                >
                                                    View Players
                                                </button>
                                            </div>
                                        )}
                                        {(isAdmin || isManager) && (
                                            <div className="mt-3 pt-3 border-t border-border flex justify-end">
                                                <Button variant="secondary" size="sm" onClick={() => setAssigningTeamId(team.id)} className="text-xs py-1 h-auto">
                                                    Assign Players
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <Card>
                            <p className="py-6 text-center text-sm text-text-muted">No teams added yet.</p>
                        </Card>
                    )}
                </div>
            )}

            {/* Fixture Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">📅 Fixture</h3>
                </div>
                {orderedFixtureRows.length > 0 ? (
                    <Card className="overflow-x-auto p-0">
                        <table className="w-full text-left text-[11px] sm:text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-border bg-surface-2/50 text-[10px] sm:text-xs text-text-muted">
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium">Time</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium">Match</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">Score</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium">Winner</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orderedFixtureRows.map(row => (
                                    <tr
                                        key={row.id}
                                        className={`transition-colors ${row.isCompleted ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-surface-2/30'}`}
                                    >
                                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-text-muted">{row.time}</td>
                                        <td className="py-2 px-2 sm:py-3 sm:px-4">
                                            <div className="flex items-center gap-1.5 sm:gap-3">
                                                {row.type === 'match' ? (
                                                    <span className="block max-w-[9rem] truncate font-medium text-text-primary sm:max-w-none">
                                                        {row.team1Name} <span className="font-black text-accent">vs</span> {row.team2Name}
                                                    </span>
                                                ) : (
                                                    <span className="block max-w-[11rem] truncate font-semibold text-accent sm:max-w-none">{row.match}</span>
                                                )}
                                                {row.isFinal && (
                                                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] font-bold uppercase tracking-wide text-accent">
                                                        Final
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-center font-mono font-semibold text-text-primary">{row.score}</td>
                                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-text-primary">
                                            <span className="block max-w-[5rem] truncate sm:max-w-none">{row.winner}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                ) : (
                    <Card>
                        <p className="py-6 text-center text-sm text-text-muted">No fixture yet.</p>
                    </Card>
                )}
            </div>

            {/* Leaderboard Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">🏆 Leaderboard</h3>
                    {isAdmin && leaderboardTab === 'players' && (
                        <Button
                            size="sm"
                            onClick={() => setIsAddPlayersOpen(true)}
                            className="text-xs"
                        >
                            Manage Players
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4 border-b border-border mb-4">
                    <button
                        onClick={() => setLeaderboardTab('teams')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${leaderboardTab === 'teams' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Teams ({teams.length})
                        {leaderboardTab === 'teams' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setLeaderboardTab('players')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${leaderboardTab === 'players' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Players ({players.length})
                        {leaderboardTab === 'players' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setLeaderboardTab('matches')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${leaderboardTab === 'matches' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Matches ({matches.length})
                        {leaderboardTab === 'matches' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />
                        )}
                    </button>
                </div>

                {leaderboardTab === 'matches' ? (
                    <div className="flex flex-col gap-4">
                        {isAdmin && (
                            <div className="flex justify-end gap-2">
                                {matches.length > 0 && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setShowDeleteAllMatchesConfirm(true)}
                                    >
                                        Delete All
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => setIsCreateMatchOpen(true)}>+ Schedule Match</Button>
                            </div>
                        )}
                        {matches.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {displayMatches.map(m => {
                                    const t1 = teams.find(t => t.id === m.team_1_id)
                                    const t2 = teams.find(t => t.id === m.team_2_id)
                                    return (
                                        <Card key={m.id} className="flex flex-col">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs text-text-muted">
                                                    {new Date(m.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {m.is_final && (
                                                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                                            Final
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-surface-3 text-text-muted' : 'bg-accent/10 text-accent'}`}>
                                                        {m.status}
                                                    </span>
                                                    {isAdmin && (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => setMatchActionMenuId(matchActionMenuId === m.id ? null : m.id)}
                                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
                                                                title="Match actions"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                    <circle cx="12" cy="5" r="2" />
                                                                    <circle cx="12" cy="12" r="2" />
                                                                    <circle cx="12" cy="19" r="2" />
                                                                </svg>
                                                            </button>
                                                            {matchActionMenuId === m.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setMatchActionMenuId(null)} />
                                                                    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface-2 py-1 shadow-xl">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (m.is_final) {
                                                                                    setUnmarkFinalConfirmId(m.id)
                                                                                } else {
                                                                                    setFinalMatchConfirmId(m.id)
                                                                                }
                                                                                setMatchActionMenuId(null)
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                        >
                                                                            {m.is_final ? 'Undo final match' : 'Mark as final match'}
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between flex-1 mb-4">
                                                {(() => {
                                                    const matchScorers = matchStats.filter(ms => ms.tournament_match_id === m.id && ms.goals > 0)
                                                    const t1Scorers = matchScorers.filter(ms => ms.team_id === t1?.id).map(ms => {
                                                        const p = players.find(player => player.player_id === ms.player_id)
                                                        const pProfile = Array.isArray(p?.profiles) ? p?.profiles[0] : p?.profiles
                                                        return `${pProfile?.first_name || 'Unknown'}${ms.goals > 1 ? `(${ms.goals})` : ''}`
                                                    }).join(', ')
                                                    
                                                    const t2Scorers = matchScorers.filter(ms => ms.team_id === t2?.id).map(ms => {
                                                        const p = players.find(player => player.player_id === ms.player_id)
                                                        const pProfile = Array.isArray(p?.profiles) ? p?.profiles[0] : p?.profiles
                                                        return `${pProfile?.first_name || 'Unknown'}${ms.goals > 1 ? `(${ms.goals})` : ''}`
                                                    }).join(', ')
                                                    const team1Score = matchScoreOrZero(m.team_1_score)
                                                    const team2Score = matchScoreOrZero(m.team_2_score)

                                                    return (
                                                        <div className="flex flex-col w-full">
                                                            <div className="flex items-center justify-between gap-4 w-full mb-2">
                                                                {/* Team 1 */}
                                                                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                                                                    {t1?.logo_url ? (
                                                                        <img src={t1.logo_url} alt="" className="h-12 w-12 rounded object-contain" />
                                                                    ) : (
                                                                        <div className="h-12 w-12 rounded bg-surface-3 flex items-center justify-center text-xs font-bold text-text-muted">
                                                                            {t1?.team_name?.substring(0,2).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-xs font-semibold text-text-primary truncate w-full text-center">{t1?.team_name || 'Unknown'}</span>
                                                                </div>

                                                                {/* Score */}
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-3 text-2xl font-bold text-text-primary">
                                                                        <span>{team1Score}</span>
                                                                        <span className="text-text-muted font-normal text-xl">-</span>
                                                                        <span>{team2Score}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Team 2 */}
                                                                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                                                                    {t2?.logo_url ? (
                                                                        <img src={t2.logo_url} alt="" className="h-12 w-12 rounded object-contain" />
                                                                    ) : (
                                                                        <div className="h-12 w-12 rounded bg-surface-3 flex items-center justify-center text-xs font-bold text-text-muted">
                                                                            {t2?.team_name?.substring(0,2).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-xs font-semibold text-text-primary truncate w-full text-center">{t2?.team_name || 'Unknown'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Scorers Section (FIFA style) */}
                                                            {m.status === 'completed' && (t1Scorers || t2Scorers) && (
                                                                <div className="mt-3 pt-3 border-t border-border/50 flex items-start justify-center gap-4">
                                                                    <div className="flex-1 flex flex-col items-end text-[10px] text-text-muted gap-0.5 leading-tight">
                                                                        {t1Scorers.split(', ').filter(Boolean).map((s, idx) => <span key={idx}>{s}</span>)}
                                                                    </div>
                                                                    <span className="text-[10px] text-text-muted opacity-50 mt-0.5">⚽</span>
                                                                    <div className="flex-1 flex flex-col items-start text-[10px] text-text-muted gap-0.5 leading-tight">
                                                                        {t2Scorers.split(', ').filter(Boolean).map((s, idx) => <span key={idx}>{s}</span>)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                            {isAdmin && (
                                                <div className="mt-auto pt-3 border-t border-border flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs h-auto py-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                        onClick={() => setDeleteMatchId(m.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                    <Button variant="secondary" size="sm" className="text-xs h-auto py-1.5" onClick={() => setRecordScoreMatchId(m.id)}>
                                                        {m.status === 'completed' ? 'Edit Score' : 'Record Score'}
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <Card>
                                <p className="py-6 text-center text-sm text-text-muted">No matches scheduled yet.</p>
                            </Card>
                        )}
                    </div>
                ) : leaderboardTab === 'players' ? (
                    players.length > 0 ? (
                        <Card className="overflow-x-auto p-0">
                        <table className="w-full text-left text-[11px] sm:text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-border bg-surface-2/50 text-[10px] sm:text-xs text-text-muted">
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium sticky left-0 bg-surface-2 z-10">Player</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">Team</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">Goals</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">Assists</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">Matches</th>
                                    <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium">Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {playerStats.map(tp => {
                                    const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                    const team = teams.find(t => t.id === tp.team_id)
                                    return (
                                        <tr key={tp.id} className="hover:bg-surface-2/30 transition-colors">
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 sticky left-0 bg-surface-2 z-10">
                                                <div className="flex items-center gap-1.5 sm:gap-3">
                                                    {/* Avatar: hidden on mobile */}
                                                    {p?.avatar_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={p.avatar_url} alt="" className="hidden sm:block h-8 w-8 rounded-full object-cover bg-surface-3 flex-shrink-0" />
                                                    ) : (
                                                        <div className="hidden sm:flex h-8 w-8 rounded-full bg-accent/20 items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                                                            {p?.first_name?.[0]}{p?.last_name?.[0]}
                                                        </div>
                                                    )}
                                                    {/* Full name on desktop */}
                                                    <span className="hidden sm:inline font-medium text-text-primary">
                                                        {p?.first_name} {p?.last_name}
                                                    </span>
                                                    {/* Abbreviated name on mobile */}
                                                    <span className="sm:hidden block max-w-[4.5rem] truncate font-medium text-text-primary">
                                                        {p?.first_name?.split(' ')[0]} {p?.last_name?.trim().charAt(0)}.
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                                                {team ? (
                                                    <div className="flex justify-center">
                                                        {team.logo_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={team.logo_url}
                                                                alt={team.team_name}
                                                                title={team.team_name}
                                                                className="h-6 w-6 rounded-lg object-contain sm:h-8 sm:w-8"
                                                            />
                                                        ) : (
                                                            <span
                                                                title={team.team_name}
                                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-surface-3 text-[9px] font-bold text-text-muted sm:h-8 sm:w-8 sm:text-[10px]"
                                                            >
                                                                {team.team_name.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <span className="text-[10px] sm:text-xs text-text-muted italic">-</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center font-bold text-text-primary">{tp.goals}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center font-bold text-text-primary">{tp.assists}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-text-muted">{tp.matchesPlayed}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4">
                                                {p?.player_position ? (
                                                    <span className="text-[10px] sm:text-xs text-text-muted capitalize">{p.player_position}</span>
                                                ) : (
                                                    <span className="text-[10px] sm:text-xs text-text-muted italic">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </Card>
                ) : (
                    <Card>
                        <p className="py-6 text-center text-sm text-text-muted">No players assigned yet.</p>
                    </Card>
                )
                ) : (
                    teams.length > 0 ? (
                        <Card className="overflow-x-auto p-0">
                            <table className="w-full text-left text-[11px] sm:text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-border bg-surface-2/50 text-[10px] sm:text-xs text-text-muted">
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center w-8 sm:w-12">Rank</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium sticky left-0 bg-surface-2 z-10">Team</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">P</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">W</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">D</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">L</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">GD</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">GF</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">GA</th>
                                        <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center text-accent">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {teamStats.map((team, idx) => (
                                        <tr key={team.id} className="hover:bg-surface-2/30 transition-colors">
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center font-semibold text-text-muted">{idx + 1}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 sticky left-0 bg-surface-2 z-10">
                                                <div className="max-w-[6rem] truncate font-medium text-text-primary sm:max-w-none">
                                                    {team.team_name}
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-text-muted">{team.played}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-emerald-400">{team.won}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-yellow-400">{team.drawn}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-red-400">{team.lost}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-text-muted">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-text-muted">{team.gf}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-text-muted">{team.ga}</td>
                                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-center font-bold text-accent">{team.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    ) : (
                        <Card>
                            <p className="py-6 text-center text-sm text-text-muted">No teams added yet.</p>
                        </Card>
                    )
                )}
            </div>

            {isAddPlayersOpen && (
                <AddPlayersModal
                    tournamentId={tournament.id}
                    allPlayers={allDbPlayers}
                    existingPlayerIds={players.map(p => p.player_id)}
                    auctionId={tournament.auction_id}
                    onClose={() => setIsAddPlayersOpen(false)}
                />
            )}

            {isCreateTeamOpen && (
                <CreateTeamModal
                    tournamentId={tournament.id}
                    onClose={() => setIsCreateTeamOpen(false)}
                />
            )}

            {isManageTeamsOpen && (
                <ManageTeamsModal
                    tournamentId={tournament.id}
                    teams={teams.map(t => {
                        const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
                        const teamPlayers = players.filter(p => p.team_id === t.id)
                        return {
                            id: t.id,
                            team_name: t.team_name,
                            team_slogan: t.team_slogan,
                            number_of_players: t.number_of_players,
                            manager_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unassigned',
                            player_count: teamPlayers.length,
                        }
                    })}
                    onClose={() => setIsManageTeamsOpen(false)}
                />
            )}

            {editingTeamId && (() => {
                const team = teams.find(t => t.id === editingTeamId)
                if (!team) return null
                return (
                    <EditTeamModal
                        teamId={team.id}
                        tournamentId={tournament.id}
                        initialData={{
                            team_name: team.team_name,
                            team_slogan: team.team_slogan ?? '',
                            number_of_players: team.number_of_players,
                            logo_url: team.logo_url ?? null,
                        }}
                        onClose={() => setEditingTeamId(null)}
                    />
                )
            })()}

            {assigningTeamId && (() => {
                const team = teams.find(t => t.id === assigningTeamId)
                if (!team) return null
                return (
                    <AssignPlayersToTeamModal
                        tournamentId={tournament.id}
                        teamId={team.id}
                        teamName={team.team_name}
                        allTournamentPlayers={players}
                        onClose={() => setAssigningTeamId(null)}
                    />
                )
            })()}

            {viewingTeamPlayersId && (() => {
                const team = teams.find(t => t.id === viewingTeamPlayersId)
                if (!team) return null
                const teamPlayers = players.filter(p => p.team_id === team.id)
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-surface-2 border border-border rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h2 className="text-lg font-bold text-text-primary">{team.team_name} Players</h2>
                                <button onClick={() => setViewingTeamPlayersId(null)} className="p-2 -mr-2 text-text-muted hover:text-text-primary transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto">
                                {teamPlayers.length === 0 ? (
                                    <p className="text-sm text-text-muted text-center py-4">No players in this team yet.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {teamPlayers.map(tp => {
                                            const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                            return (
                                                <div key={tp.id} className="flex items-center gap-3 bg-surface-3 p-3 rounded-lg">
                                                    {p?.avatar_url ? (
                                                        <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                                                            {p?.first_name?.[0]}{p?.last_name?.[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-text-primary">{p?.first_name} {p?.last_name}</div>
                                                        {p?.player_position && <div className="text-xs text-text-muted capitalize">{p.player_position}</div>}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })()}

            {isCreateMatchOpen && (
                <CreateTournamentMatchModal
                    tournamentId={tournament.id}
                    teams={teams}
                    onClose={() => setIsCreateMatchOpen(false)}
                />
            )}

            {recordScoreMatchId && (() => {
                const match = matches.find(m => m.id === recordScoreMatchId)
                if (!match) return null
                const t1 = teams.find(t => t.id === match.team_1_id)
                const t2 = teams.find(t => t.id === match.team_2_id)
                if (!t1 || !t2) return null

                const mapPlayer = (p: TournamentPlayer) => {
                    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
                    return {
                        player_id: p.player_id,
                        team_id: p.team_id,
                        first_name: profile?.first_name || '',
                        last_name: profile?.last_name || '',
                        avatar_url: profile?.avatar_url || null
                    }
                }

                const t1Players = players.filter(p => p.team_id === t1.id).map(mapPlayer)
                const t2Players = players.filter(p => p.team_id === t2.id).map(mapPlayer)
                const currentMatchStats = matchStats
                    .filter(ms => ms.tournament_match_id === match.id)
                    .map(ms => ({
                        player_id: ms.player_id,
                        goals: ms.goals,
                        assists: ms.assists ?? 0,
                    }))

                return (
                    <RecordMatchScoreModal
                        tournamentId={tournament.id}
                        match={match}
                        team1={t1}
                        team2={t2}
                        team1Players={t1Players}
                        team2Players={t2Players}
                        initialStats={currentMatchStats.map(stat => ({
                            player_id: stat.player_id,
                            goals: stat.goals,
                            assists: stat.assists || 0
                        }))}
                        onClose={() => setRecordScoreMatchId(null)}
                    />
                )
            })()}

            {deleteMatchId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isDeletingMatch && setDeleteMatchId(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Delete Match</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to delete this tournament match? This action cannot be undone.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteMatchId(null)} disabled={isDeletingMatch}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleDeleteMatch} disabled={isDeletingMatch}>
                                {isDeletingMatch ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteAllMatchesConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isDeletingMatch && setShowDeleteAllMatchesConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Delete All Matches</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to delete all matches for this tournament? Recorded scores and player match stats will also be removed.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteAllMatchesConfirm(false)} disabled={isDeletingMatch}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleDeleteAllMatches} disabled={isDeletingMatch}>
                                {isDeletingMatch ? 'Deleting...' : 'Delete All'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {finalMatchConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isMarkingFinal && setFinalMatchConfirmId(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Mark Final Match</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to mark this match as the final? It will replace the default final row in the fixture.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setFinalMatchConfirmId(null)} disabled={isMarkingFinal}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleMarkFinalMatch} disabled={isMarkingFinal}>
                                {isMarkingFinal ? 'Marking...' : 'Yes, Mark Final'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {unmarkFinalConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isMarkingFinal && setUnmarkFinalConfirmId(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Undo Final Match</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Are you sure you want to remove the final marker from this match? The fixture will show the default final placeholder again.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setUnmarkFinalConfirmId(null)} disabled={isMarkingFinal}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleUnmarkFinalMatch} disabled={isMarkingFinal}>
                                {isMarkingFinal ? 'Removing...' : 'Yes, Undo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

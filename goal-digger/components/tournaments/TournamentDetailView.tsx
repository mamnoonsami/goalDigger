'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../ui/Card'
import { TournamentStatusBadge } from './TournamentStatusBadge'
import { TournamentDetailActions } from './TournamentDetailActions'
import { EditTournamentModal } from './EditTournamentModal'
import { Button } from '../ui/Button'
import { deleteAllTournamentMatches, deleteTournamentMatch, joinTournament, leaveTournament, markTournamentMatchAsFinal, resetTournamentMatch, unmarkTournamentMatchAsFinal, markTournamentMatchAsOngoing, unmarkTournamentMatchAsOngoing } from '../../app/actions/tournaments'
import { useToast } from '../providers/ToastProvider'
import { AddPlayersModal } from './AddPlayersModal'
import { CreateTeamModal } from './CreateTeamModal'
import { ManageTeamsModal } from './ManageTeamsModal'
import { EditTeamModal } from './EditTeamModal'
import { AssignPlayersToTeamModal } from './AssignPlayersToTeamModal'
import { CreateTournamentMatchModal } from './CreateTournamentMatchModal'
import { RecordMatchScoreModal } from './RecordMatchScoreModal'
import { EditTournamentMatchModal } from './EditTournamentMatchModal'
import { TeamLogo } from './TeamLogo'

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
    winningTeam: 'team1' | 'team2' | null
    isCompleted: boolean
    isFinal: boolean
}

interface FixtureFinalRow {
    type: 'final'
    id: 'final'
    time: 'TBD'
    match: 'Top 2 teams from leaderboard'
    score: '-'
    winningTeam: null
    isCompleted: false
    isFinal: true
}

type FixtureRow = FixtureMatchRow | FixtureFinalRow

const DATE_TIME_LOCALE = 'en-US'

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
    return new Date(matchDate).toLocaleTimeString(DATE_TIME_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

export function TournamentDetailView({ tournament, teams, players, matches = [], matchStats = [], linkedAuction, allAuctions, allDbPlayers = [], isAdmin, isPlayer = false, isManager = false, hasJoined = false, currentUserId = null }: Props) {
    const router = useRouter()
    const toast = useToast()
    const teamsPanelRef = useRef<HTMLDivElement>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [fixturePanelHeight, setFixturePanelHeight] = useState<number | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isAddPlayersOpen, setIsAddPlayersOpen] = useState(false)
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
    const [isManageTeamsOpen, setIsManageTeamsOpen] = useState(false)
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
    const [assigningTeamId, setAssigningTeamId] = useState<string | null>(null)
    const [viewingTeamPlayersId, setViewingTeamPlayersId] = useState<string | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [teamsSectionMenuOpen, setTeamsSectionMenuOpen] = useState(false)
    const [matchesSectionMenuOpen, setMatchesSectionMenuOpen] = useState(false)
    const [leaderboardTab, setLeaderboardTab] = useState<'players' | 'teams' | 'matches'>('teams')
    const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false)
    const [recordScoreMatchId, setRecordScoreMatchId] = useState<string | null>(null)
    const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null)
    const [showDeleteAllMatchesConfirm, setShowDeleteAllMatchesConfirm] = useState(false)
    const [isDeletingMatch, setIsDeletingMatch] = useState(false)
    const [resetMatchConfirmId, setResetMatchConfirmId] = useState<string | null>(null)
    const [isResettingMatch, setIsResettingMatch] = useState(false)
    const [matchActionMenuId, setMatchActionMenuId] = useState<string | null>(null)
    const [finalMatchConfirmId, setFinalMatchConfirmId] = useState<string | null>(null)
    const [unmarkFinalConfirmId, setUnmarkFinalConfirmId] = useState<string | null>(null)
    const [isMarkingFinal, setIsMarkingFinal] = useState(false)
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
    const [ongoingConfirmId, setOngoingConfirmId] = useState<string | null>(null)
    const [unmarkOngoingConfirmId, setUnmarkOngoingConfirmId] = useState<string | null>(null)
    const [isMarkingOngoing, setIsMarkingOngoing] = useState(false)

    useEffect(() => {
        if (!currentUserId) {
            setFixturePanelHeight(null)
            return
        }

        const mediaQuery = window.matchMedia('(min-width: 1024px)')

        const syncFixtureHeight = () => {
            if (!mediaQuery.matches || !teamsPanelRef.current) {
                setFixturePanelHeight(null)
                return
            }

            setFixturePanelHeight(teamsPanelRef.current.offsetHeight)
        }

        syncFixtureHeight()

        const resizeObserver = new ResizeObserver(syncFixtureHeight)
        if (teamsPanelRef.current) {
            resizeObserver.observe(teamsPanelRef.current)
        }

        mediaQuery.addEventListener('change', syncFixtureHeight)
        window.addEventListener('resize', syncFixtureHeight)

        return () => {
            resizeObserver.disconnect()
            mediaQuery.removeEventListener('change', syncFixtureHeight)
            window.removeEventListener('resize', syncFixtureHeight)
        }
    }, [currentUserId, teams.length, players.length, isAdmin, isManager])

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
        const winningTeam = !isCompleted
            ? null
            : team1Score > team2Score
                ? 'team1'
                : team2Score > team1Score
                    ? 'team2'
                    : null

        return {
            type: 'match',
            id: match.id,
            time: formatFixtureTime(match.match_date),
            team1Name: team1?.team_name ?? 'Unknown',
            team2Name: team2?.team_name ?? 'Unknown',
            score: isCompleted ? `${team1Score} - ${team2Score}` : '-',
            winningTeam,
            isCompleted,
            isFinal: !!match.is_final,
        }
    }

    const orderedFixtureRows: FixtureRow[] = [
        ...(finalMatch ? [getFixtureMatchRow(finalMatch)] : []),
        ...normalFixtureMatches.map(getFixtureMatchRow),
        ...(matches.length > 0 && !finalMatch
            ? [{ type: 'final', id: 'final', time: 'TBD', match: 'Top 2 teams from leaderboard', score: '-', winningTeam: null, isCompleted: false, isFinal: true } as FixtureFinalRow]
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

    async function handleResetMatch() {
        if (!resetMatchConfirmId) return

        setIsResettingMatch(true)
        try {
            await resetTournamentMatch(tournament.id, resetMatchConfirmId)
            toast.success('Match reset')
            setResetMatchConfirmId(null)
            setMatchActionMenuId(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to reset match')
        } finally {
            setIsResettingMatch(false)
        }
    }

    async function handleMarkOngoing() {
        if (!ongoingConfirmId) return
        setIsMarkingOngoing(true)
        try {
            await markTournamentMatchAsOngoing(tournament.id, ongoingConfirmId)
            toast.success('Match marked as ongoing')
            setOngoingConfirmId(null)
            setMatchActionMenuId(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to mark ongoing')
        } finally {
            setIsMarkingOngoing(false)
        }
    }

    async function handleUnmarkOngoing() {
        if (!unmarkOngoingConfirmId) return
        setIsMarkingOngoing(true)
        try {
            await unmarkTournamentMatchAsOngoing(tournament.id, unmarkOngoingConfirmId)
            toast.success('Match marked as scheduled')
            setUnmarkOngoingConfirmId(null)
            setMatchActionMenuId(null)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update match')
        } finally {
            setIsMarkingOngoing(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Tournament Header Card */}
            <Card>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h1 className="min-w-0 text-xl font-bold leading-tight text-text-primary sm:text-2xl">
                                <span>
                                    {tournament.name}
                                </span>
                                <span className="ml-2 inline-flex align-middle">
                                    <TournamentStatusBadge status={tournament.status} />
                                </span>
                            </h1>
                        </div>

                        {/* Desktop actions */}
                        <div className="hidden shrink-0 items-center gap-2 sm:flex">
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
                            <div className="relative shrink-0 sm:hidden">
                                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full border border-border bg-surface-2 p-2 text-text-muted shadow-sm transition-colors hover:bg-surface-3">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
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

                    <div className="space-y-2 text-xs text-text-muted sm:flex sm:flex-wrap sm:gap-2 sm:space-y-0 sm:text-sm">
                        <div className="flex min-w-0 items-center gap-2 sm:contents">
                            {tournament.start_date && (
                                <span className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-border/70 bg-surface-2/70 px-2 py-2 sm:flex-none sm:justify-start sm:gap-1.5 sm:px-3">
                                    <span className="shrink-0">📅</span>
                                    <span className="min-w-0 truncate">
                                        {new Date(tournament.start_date + 'T00:00').toLocaleDateString(DATE_TIME_LOCALE, { month: 'short', day: 'numeric' })}
                                        {tournament.end_date && tournament.end_date !== tournament.start_date
                                            ? ` – ${new Date(tournament.end_date + 'T00:00').toLocaleDateString(DATE_TIME_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                            : `, ${new Date(tournament.start_date + 'T00:00').getFullYear()}`
                                        }
                                    </span>
                                </span>
                            )}
                            <span className="flex shrink-0 items-center justify-center gap-1 rounded-xl border border-border/70 bg-surface-2/70 px-2 py-2 sm:justify-start sm:gap-1.5 sm:px-3">
                                <span className="shrink-0">🏆</span>
                                <span>{teams.length} teams</span>
                            </span>
                            <span className="flex shrink-0 items-center justify-center gap-1 rounded-xl border border-border/70 bg-surface-2/70 px-2 py-2 sm:justify-start sm:gap-1.5 sm:px-3">
                                <span className="shrink-0">⚽</span>
                                <span>{players.length} players</span>
                            </span>
                        </div>
                        {tournament.location && (
                            <span className="flex min-w-0 items-center gap-1.5 rounded-xl border border-border/70 bg-surface-2/70 px-3 py-2 sm:max-w-xs">
                                <span className="shrink-0">📍</span>
                                <span className="min-w-0 truncate">{tournament.location}</span>
                            </span>
                        )}
                        {linkedAuction && (
                            <a href={`/auctions/${linkedAuction.id}`} className="flex min-w-0 items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-accent transition-colors hover:text-accent-hover sm:max-w-xs">
                                <span className="shrink-0">🔨</span>
                                <span className="min-w-0 truncate">{linkedAuction.title}</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Description */}
                {tournament.description && (
                    <div className="mt-4 rounded-xl border border-border/70 bg-surface-2/60 px-3 py-3 text-sm text-text-muted">
                        <p className="whitespace-pre-wrap leading-relaxed"><span className="text-text-primary mr-1">📋</span>{tournament.description}</p>
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

            <div className={`grid min-w-0 max-w-full gap-6 ${currentUserId ? 'lg:grid-cols-2 lg:items-start' : ''}`}>
                {/* Teams Section */}
                {currentUserId && (
                    <div ref={teamsPanelRef} className="min-w-0 max-w-full">
                        <div className="min-w-0 max-w-full lg:rounded-xl lg:border lg:border-border lg:bg-surface-2 lg:p-5">
                            <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                                <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-accent">
                                    <svg className="h-5 w-5 shrink-0 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    <span className="truncate">Teams ({teams.length})</span>
                                </h3>
                                {(isAdmin || isManager) && (
                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setTeamsSectionMenuOpen(!teamsSectionMenuOpen)}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
                                            title="Team actions"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <circle cx="12" cy="5" r="2" />
                                                <circle cx="12" cy="12" r="2" />
                                                <circle cx="12" cy="19" r="2" />
                                            </svg>
                                        </button>
                                        {teamsSectionMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setTeamsSectionMenuOpen(false)} />
                                                <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface-2 py-1 shadow-xl sm:left-auto sm:right-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsCreateTeamOpen(true)
                                                            setTeamsSectionMenuOpen(false)
                                                        }}
                                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                    >
                                                        <svg className="h-4 w-4 shrink-0 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                                                        <span>Create team</span>
                                                    </button>
                                                    {teams.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsManageTeamsOpen(true)
                                                                setTeamsSectionMenuOpen(false)
                                                            }}
                                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                        >
                                                            <svg className="h-4 w-4 shrink-0 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                            <span>Manage teams</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {teams.length > 0 ? (
                                <div className="grid gap-2 sm:grid-cols-2 lg:gap-3 min-w-0">
                                    {teams.map(team => {
                                        const teamPlayers = players.filter(p => p.team_id === team.id)
                                        return (
                                            <Card key={team.id} padding="none" className="min-w-0 max-w-full overflow-hidden p-2.5 sm:p-4">
                                                <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                                                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                                                        <TeamLogo 
                                                            teamName={team.team_name}
                                                            logoUrl={team.logo_url}
                                                            className="h-8 w-8 rounded-lg sm:h-9 sm:w-9"
                                                            fallbackClassName="h-8 w-8 rounded-lg text-[11px] sm:h-9 sm:w-9 sm:text-xs"
                                                        />
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-semibold text-text-primary truncate sm:text-base">{team.team_name}</h4>
                                                            {team.team_slogan && (
                                                                <p className="text-xs text-text-muted italic truncate">&ldquo;{team.team_slogan}&rdquo;</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[9px] text-text-muted sm:px-2 sm:text-xs">
                                                            <span className="sm:hidden">{teamPlayers.length}</span>
                                                            <span className="hidden sm:inline">{teamPlayers.length} players</span>
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
                                                    <div className="mt-2 pt-2 border-t border-border flex justify-end">
                                                        <Button variant="secondary" size="sm" onClick={() => setAssigningTeamId(team.id)} className="text-[11px] py-1 h-auto sm:text-xs">
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
                    </div>
                )}

                {/* Fixture Section */}
                <div
                    className="flex h-full min-w-0 max-w-full flex-col lg:rounded-xl lg:border lg:border-border lg:bg-surface-2 lg:p-5"
                    style={fixturePanelHeight ? { height: fixturePanelHeight } : undefined}
                >
                    <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-accent">
                            <svg className="h-5 w-5 shrink-0 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                            <span>Fixture</span>
                        </h3>
                    </div>
                    {orderedFixtureRows.length > 0 ? (
                        <div className="scrollbar-thin min-h-0 w-full max-w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-border [scrollbar-color:rgba(34,197,94,0.35)_transparent] [scrollbar-gutter:stable] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-500/30 [&::-webkit-scrollbar-thumb:hover]:bg-emerald-500/50">
                            <table className="w-full min-w-[360px] text-left text-[11px] sm:min-w-0 sm:text-sm">
                                <thead className="sticky top-0 z-20">
                                    <tr className="border-b border-emerald-600 bg-header-bg text-[10px] text-white shadow-sm shadow-accent/20 lg:border-border lg:bg-surface-2 lg:text-text-muted lg:shadow-none sm:text-xs">
                                        <th className="py-2 px-3 sm:py-3 sm:px-4 font-medium text-center">Match</th>
                                        <th className="py-2 px-3 sm:py-3 sm:px-4 font-medium text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orderedFixtureRows.map(row => {
                                        const matchObj = row.type === 'match' ? matches.find(m => m.id === row.id) : null
                                        const t1 = matchObj ? teams.find(t => t.id === matchObj.team_1_id) : null
                                        const t2 = matchObj ? teams.find(t => t.id === matchObj.team_2_id) : null

                                        // Ongoing indicator: driven by status field
                                        const isOngoing = matchObj && matchObj.status === 'ongoing'

                                        return (
                                            <tr
                                                key={row.id}
                                                className="group transition-colors"
                                            >
                                                <td className={`py-2.5 px-3 sm:py-3 sm:px-4 transition-colors ${row.isCompleted
                                                    ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
                                                    : orderedFixtureRows.indexOf(row) % 2 === 0
                                                        ? 'bg-surface-1/30 group-hover:bg-surface-1/50'
                                                        : 'group-hover:bg-surface-2/30'
                                                    }`}>
                                                    {row.type === 'match' ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            {/* Team layout: logo + name — VS — logo + name (tighter spacing) */}
                                                            <div className="flex items-center gap-1">
                                                                {/* Team 1 */}
                                                                <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                                                    {row.winningTeam === 'team1' && (
                                                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-black text-emerald-400 ring-1 ring-emerald-500/30">
                                                                            W
                                                                        </span>
                                                                    )}
                                                                    <span className="truncate text-right text-[10px] font-medium text-text-primary sm:text-sm">{t1?.team_name ?? row.team1Name}</span>
                                                                    <TeamLogo
                                                                        teamName={row.team1Name}
                                                                        logoUrl={t1?.logo_url}
                                                                        className="h-5 w-5 sm:h-6 sm:w-6 rounded object-contain flex-shrink-0"
                                                                        fallbackClassName="h-5 w-5 sm:h-6 sm:w-6 rounded text-[8px]"
                                                                    />
                                                                </div>
                                                                {/* VS anchor */}
                                                                <span className="shrink-0 w-7 text-center text-[10px] sm:text-xs font-black text-accent">VS</span>
                                                                {/* Team 2 */}
                                                                <div className="flex items-center gap-1 flex-1 min-w-0 justify-start">
                                                                    <TeamLogo
                                                                        teamName={row.team2Name}
                                                                        logoUrl={t2?.logo_url}
                                                                        className="h-5 w-5 sm:h-6 sm:w-6 rounded object-contain flex-shrink-0"
                                                                        fallbackClassName="h-5 w-5 sm:h-6 sm:w-6 rounded text-[8px]"
                                                                    />
                                                                    <span className="truncate text-[10px] font-medium text-text-primary sm:text-sm">{t2?.team_name ?? row.team2Name}</span>
                                                                    {row.winningTeam === 'team2' && (
                                                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-black text-emerald-400 ring-1 ring-emerald-500/30">
                                                                            W
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Date + time + ongoing — centered below, anchored to VS position */}
                                                            <div className="flex items-center gap-1">
                                                                {/* spacer matching team-1 side — leave empty */}
                                                                <div className="flex-1" />
                                                                <div className="flex items-center justify-center gap-1 w-7">
                                                                    {isOngoing ? (
                                                                        <span className="relative flex h-1.5 w-1.5">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="flex-1" />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex-1" />
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <span className="text-[10px] sm:text-[11px] text-text-muted">
                                                                        {new Date(matchObj!.match_date).toLocaleDateString(DATE_TIME_LOCALE, { month: 'short', day: 'numeric' })}
                                                                        {' · '}
                                                                        {new Date(matchObj!.match_date).toLocaleTimeString(DATE_TIME_LOCALE, { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </span>
                                                                    {isOngoing && (
                                                                        <span className="text-[10px] font-bold text-red-400 animate-pulse">· Ongoing</span>
                                                                    )}
                                                                    {row.isFinal && (
                                                                        <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] sm:px-2 sm:text-[10px] font-bold uppercase tracking-wide text-accent">Final</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Final placeholder row — styled like a match row with VS layout
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1">
                                                                {/* Left side: Top team */}
                                                                <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                                                    <span className="truncate text-right text-[10px] font-medium text-text-muted sm:text-sm">Top team</span>
                                                                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded bg-surface-3 text-[8px] sm:text-[9px] font-bold text-text-muted flex-shrink-0">1st</div>
                                                                </div>
                                                                {/* VS anchor */}
                                                                <span className="shrink-0 w-7 text-center text-[10px] sm:text-xs font-black text-accent">VS</span>
                                                                {/* Right side: 2nd team */}
                                                                <div className="flex items-center gap-1 flex-1 min-w-0 justify-start">
                                                                    <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded bg-surface-3 text-[8px] sm:text-[9px] font-bold text-text-muted flex-shrink-0">2nd</div>
                                                                    <span className="truncate text-[10px] font-medium text-text-muted sm:text-sm">2nd team</span>
                                                                </div>
                                                            </div>
                                                            {/* TBD metadata row anchored below VS */}
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex-1" />
                                                                <span className="w-7 text-center text-[10px] sm:text-[11px] text-text-muted/50 italic">TBD</span>
                                                                <div className="flex-1" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className={`py-2 px-3 sm:py-3 sm:px-4 text-center font-mono font-semibold text-text-primary whitespace-nowrap transition-colors ${row.isCompleted
                                                    ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
                                                    : orderedFixtureRows.indexOf(row) % 2 === 0
                                                        ? 'bg-surface-1/30 group-hover:bg-surface-1/50'
                                                        : 'group-hover:bg-surface-2/30'
                                                    }`}>{row.score}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border">
                            <p className="py-6 text-center text-sm text-text-muted">No fixture yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard Section */}
            <div className="relative mt-8">
                {/* Full-width background bleed */}
                <div className="absolute inset-y-0 left-[-100vw] right-[-100vw] border-y border-border/80 bg-white/15" />

                <div className="relative py-8">
                    <div>
                        <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-accent">
                                <svg className="h-5 w-5 shrink-0 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                                <span>Leaderboard</span>
                            </h3>
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
                        </div>

                        {false ? (
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
                                                <Card key={m.id} padding="none" className="flex flex-col p-3 sm:p-5">
                                                    <div className="mb-2 flex items-center justify-between sm:mb-4">
                                                        <span className="text-[11px] text-text-muted sm:text-xs">
                                                            {new Date(m.match_date).toLocaleDateString(DATE_TIME_LOCALE, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
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
                                                                                        setEditingMatchId(m.id)
                                                                                        setMatchActionMenuId(null)
                                                                                    }}
                                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                                >
                                                                                    <svg className="h-4 w-4 shrink-0 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                                                    <span>Edit match</span>
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (m.status === 'ongoing') {
                                                                                            setUnmarkOngoingConfirmId(m.id)
                                                                                        } else {
                                                                                            setOngoingConfirmId(m.id)
                                                                                        }
                                                                                        setMatchActionMenuId(null)
                                                                                    }}
                                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                                >
                                                                                    <span className="relative flex h-3 w-3 shrink-0">
                                                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                                                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                                                                                    </span>
                                                                                    <span>{m.status === 'ongoing' ? 'Undo ongoing' : 'Mark as ongoing'}</span>
                                                                                </button>
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
                                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                                >
                                                                                    <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                                                                                    <span>{m.is_final ? 'Undo final match' : 'Mark as final match'}</span>
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setResetMatchConfirmId(m.id)
                                                                                        setMatchActionMenuId(null)
                                                                                    }}
                                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-amber-400 transition-colors hover:bg-surface-3"
                                                                                >
                                                                                    <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></svg>
                                                                                    <span>Reset this match</span>
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mb-2 flex flex-1 items-center justify-between sm:mb-4">
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
                                                                    <div className="mb-1.5 flex w-full items-center justify-between gap-3 sm:mb-2 sm:gap-4">
                                                                        {/* Team 1 */}
                                                                        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
                                                                            <TeamLogo
                                                                                teamName={t1?.team_name}
                                                                                logoUrl={t1?.logo_url}
                                                                                className="h-10 w-10 sm:h-12 sm:w-12 rounded"
                                                                                fallbackClassName="h-10 w-10 sm:h-12 sm:w-12 rounded text-[11px] sm:text-xs"
                                                                            />
                                                                            <span className="w-full truncate text-center text-[11px] font-semibold text-text-primary sm:text-xs">{t1?.team_name || 'Unknown'}</span>
                                                                        </div>

                                                                        {/* Score */}
                                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                                            <div className="flex items-center gap-2 text-xl font-bold text-text-primary sm:gap-3 sm:text-2xl">
                                                                                <span>{team1Score}</span>
                                                                                <span className="text-lg font-normal text-text-muted sm:text-xl">-</span>
                                                                                <span>{team2Score}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Team 2 */}
                                                                        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
                                                                            <TeamLogo
                                                                                teamName={t2?.team_name}
                                                                                logoUrl={t2?.logo_url}
                                                                                className="h-10 w-10 sm:h-12 sm:w-12 rounded"
                                                                                fallbackClassName="h-10 w-10 sm:h-12 sm:w-12 rounded text-[11px] sm:text-xs"
                                                                            />
                                                                            <span className="w-full truncate text-center text-[11px] font-semibold text-text-primary sm:text-xs">{t2?.team_name || 'Unknown'}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Scorers Section (FIFA style) */}
                                                                    {m.status === 'completed' && (t1Scorers || t2Scorers) && (
                                                                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1.5 border-t border-border/50 pt-2 text-[10px] leading-snug text-text-muted sm:mt-3 sm:gap-2 sm:pt-3 sm:text-[11px]">
                                                                            <span className="min-w-0 whitespace-normal break-words text-right">
                                                                                {t1Scorers}
                                                                            </span>
                                                                            <span className="opacity-50">⚽</span>
                                                                            <span className="min-w-0 whitespace-normal break-words text-left">
                                                                                {t2Scorers}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-2 sm:pt-3">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-auto py-1 text-[11px] text-red-500 hover:bg-red-500/10 hover:text-red-400 sm:py-1.5 sm:text-xs"
                                                                onClick={() => setDeleteMatchId(m.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                            <Button variant="secondary" size="sm" className="h-auto py-1 text-[11px] sm:py-1.5 sm:text-xs" onClick={() => setRecordScoreMatchId(m.id)}>
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
                                <Card className="scrollbar-thin max-h-[22rem] overflow-auto p-0 [scrollbar-color:rgba(34,197,94,0.35)_transparent] [scrollbar-gutter:stable] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-500/30 [&::-webkit-scrollbar-thumb:hover]:bg-emerald-500/50 sm:max-h-[26.5rem]">
                                    <table className="w-auto min-w-full text-left text-[11px] sm:text-sm whitespace-nowrap">
                                        <thead className="sticky top-0 z-20">
                                            <tr className="border-b border-emerald-600 bg-header-bg text-[10px] text-white shadow-sm shadow-accent/20 sm:text-xs">
                                                <th className="w-7 py-2 pl-2 pr-1 text-center font-medium sm:w-10 sm:py-3 sm:pl-4 sm:pr-2">Rank</th>
                                                <th className="w-[7.25rem] py-2 px-1 font-medium sm:w-auto sm:py-3 sm:px-2">Player</th>
                                                <th className="py-2 px-1 font-medium text-center sm:py-3 sm:px-2">Team</th>
                                                <th className="py-2 px-1.5 font-medium text-center sm:py-3 sm:px-3">Goals</th>
                                                <th className="py-2 px-1.5 font-medium text-center sm:py-3 sm:px-3">Assists</th>
                                                <th className="py-2 px-1.5 font-medium text-center sm:py-3 sm:px-3">Matches</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {playerStats.map((tp, idx) => {
                                                const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                                const team = teams.find(t => t.id === tp.team_id)
                                                const isEven = idx % 2 === 0
                                                return (
                                                    <tr key={tp.id} className={`group transition-colors ${isEven ? 'bg-surface-1/30' : ''} hover:bg-surface-1/50`}>
                                                        <td className="py-2 pl-2 pr-1 text-center font-semibold text-text-muted sm:py-3 sm:pl-4 sm:pr-2">{idx + 1}</td>
                                                        <td className="py-2 px-1 sm:py-3 sm:px-2">
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
                                                                <span className="sm:hidden block max-w-[6.75rem] truncate font-medium text-text-primary">
                                                                    {p?.first_name?.split(' ')[0]} {p?.last_name?.trim() ? `${p.last_name.trim().slice(0, 8)}${p.last_name.trim().length > 8 ? '.' : ''}` : ' '}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-1 sm:py-3 sm:px-2">
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
                                                        <td className="py-2 px-1.5 text-center font-bold text-text-primary sm:py-3 sm:px-3">{tp.goals}</td>
                                                        <td className="py-2 px-1.5 text-center font-bold text-text-primary sm:py-3 sm:px-3">{tp.assists}</td>
                                                        <td className="py-2 px-1.5 text-center text-text-muted sm:py-3 sm:px-3">{tp.matchesPlayed}</td>
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
                                <Card className="scrollbar-thin max-h-[22rem] overflow-auto p-0 [scrollbar-color:rgba(34,197,94,0.35)_transparent] [scrollbar-gutter:stable] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-500/30 [&::-webkit-scrollbar-thumb:hover]:bg-emerald-500/50 sm:max-h-[26.5rem]">
                                    <table className="w-full text-left text-[11px] sm:text-sm whitespace-nowrap">
                                        <thead className="sticky top-0 z-20">
                                            <tr className="border-b border-emerald-600 bg-header-bg text-[10px] text-white shadow-sm shadow-accent/20 sm:text-xs">
                                                <th className="w-7 py-2 pl-2 pr-1 text-center font-medium sm:w-10 sm:py-3 sm:pl-4 sm:pr-2">Rank</th>
                                                <th className="py-2 px-1 font-medium sm:py-3 sm:px-2">Team</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">P</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">W</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">D</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">L</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">GD</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">GF</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center">GA</th>
                                                <th className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-center text-white">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {teamStats.map((team, idx) => {
                                                const isEven = idx % 2 === 0
                                                return (
                                                    <tr key={team.id} className={`group transition-colors ${isEven ? 'bg-surface-1/30' : ''} hover:bg-surface-1/50`}>
                                                        <td className="py-2 pl-2 pr-1 text-center font-semibold text-text-muted sm:py-3 sm:pl-4 sm:pr-2">{idx + 1}</td>
                                                        <td className="py-2 px-1 sm:py-3 sm:px-2">
                                                            <div className="flex items-center gap-2">
                                                                {team.logo_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={team.logo_url} alt="" className="h-6 w-6 sm:h-7 sm:w-7 rounded object-contain flex-shrink-0" />
                                                                ) : (
                                                                    <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded bg-surface-3 text-[9px] font-bold text-text-muted flex-shrink-0">
                                                                        {team.team_name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div className="max-w-[6rem] truncate font-medium text-text-primary sm:max-w-none">
                                                                    {team.team_name}
                                                                </div>
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
                                                )
                                            })}
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
                </div>
            </div>

            {/* Matches Section */}
            <div>
                <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-accent">
                        <svg className="h-5 w-5 shrink-0 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m12 3 3.5 6.5L22 10" /><path d="m12 3-3.5 6.5L2 10" /><path d="m4.5 18 4-5.5L12 21" /><path d="m19.5 18-4-5.5L12 21" /><path d="m8.5 9.5 3.5 2.5 3.5-2.5" /></svg>
                        <span>Matches ({matches.length})</span>
                    </h3>
                    {isAdmin && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMatchesSectionMenuOpen(!matchesSectionMenuOpen)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
                                title="Match section actions"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                </svg>
                            </button>
                            {matchesSectionMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMatchesSectionMenuOpen(false)} />
                                    <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-surface-2 py-1 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCreateMatchOpen(true)
                                                setMatchesSectionMenuOpen(false)
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                        >
                                            <svg className="h-4 w-4 shrink-0 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M12 14v4" /><path d="M10 16h4" /></svg>
                                            <span>Schedule match</span>
                                        </button>
                                        {matches.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowDeleteAllMatchesConfirm(true)
                                                    setMatchesSectionMenuOpen(false)
                                                }}
                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-surface-3"
                                            >
                                                <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                                                <span>Delete all matches</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                {matches.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {displayMatches.map(m => {
                            const t1 = teams.find(t => t.id === m.team_1_id)
                            const t2 = teams.find(t => t.id === m.team_2_id)
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
                                <Card key={m.id} padding="none" className="flex flex-col p-3 sm:p-5">
                                    <div className="mb-2 flex items-center justify-between sm:mb-4">
                                        <span className="text-[11px] text-text-muted sm:text-xs">
                                            {new Date(m.match_date).toLocaleDateString(DATE_TIME_LOCALE, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            {m.is_final && (
                                                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                                    Final
                                                </span>
                                            )}
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${m.status === 'completed'
                                                ? 'bg-surface-3 text-text-muted'
                                                : m.status === 'ongoing'
                                                    ? 'bg-red-500/10 text-red-500 animate-pulse ring-1 ring-red-500/30'
                                                    : 'bg-accent/10 text-accent'
                                                }`}>
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
                                                                        setEditingMatchId(m.id)
                                                                        setMatchActionMenuId(null)
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                >
                                                                    <svg className="h-4 w-4 shrink-0 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                                    <span>Edit match</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (m.status === 'ongoing') {
                                                                            setUnmarkOngoingConfirmId(m.id)
                                                                        } else {
                                                                            setOngoingConfirmId(m.id)
                                                                        }
                                                                        setMatchActionMenuId(null)
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                >
                                                                    <span className="relative flex h-3 w-3 shrink-0">
                                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                                                                    </span>
                                                                    <span>{m.status === 'ongoing' ? 'Undo ongoing' : 'Mark as ongoing'}</span>
                                                                </button>
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
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-3"
                                                                >
                                                                    <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                                                                    <span>{m.is_final ? 'Undo final match' : 'Mark as final match'}</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setResetMatchConfirmId(m.id)
                                                                        setMatchActionMenuId(null)
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-amber-400 transition-colors hover:bg-surface-3"
                                                                >
                                                                    <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></svg>
                                                                    <span>Reset this match</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDeleteMatchId(m.id)
                                                                        setMatchActionMenuId(null)
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-surface-3"
                                                                >
                                                                    <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                                                                    <span>Delete match</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-2 flex flex-1 items-center justify-between sm:mb-4">
                                        <div className="flex w-full flex-col">
                                            <div className="mb-1.5 flex w-full items-center justify-between gap-3 sm:mb-2 sm:gap-4">
                                                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
                                                    <TeamLogo
                                                        teamName={t1?.team_name}
                                                        logoUrl={t1?.logo_url}
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded"
                                                        fallbackClassName="h-10 w-10 sm:h-12 sm:w-12 rounded text-[11px] sm:text-xs"
                                                    />
                                                    <span className="w-full truncate text-center text-[11px] font-semibold text-text-primary sm:text-xs">{t1?.team_name || 'Unknown'}</span>
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="flex items-center gap-2 text-xl font-bold text-text-primary sm:gap-3 sm:text-2xl">
                                                        <span>{team1Score}</span>
                                                        <span className="text-lg font-normal text-text-muted sm:text-xl">-</span>
                                                        <span>{team2Score}</span>
                                                    </div>
                                                </div>

                                                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
                                                    <TeamLogo
                                                        teamName={t2?.team_name}
                                                        logoUrl={t2?.logo_url}
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded"
                                                        fallbackClassName="h-10 w-10 sm:h-12 sm:w-12 rounded text-[11px] sm:text-xs"
                                                    />
                                                    <span className="w-full truncate text-center text-[11px] font-semibold text-text-primary sm:text-xs">{t2?.team_name || 'Unknown'}</span>
                                                </div>
                                            </div>

                                            {m.status === 'completed' && (t1Scorers || t2Scorers) && (
                                                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1.5 border-t border-border/50 pt-2 text-[10px] leading-snug text-text-muted sm:mt-3 sm:gap-2 sm:pt-3 sm:text-[11px]">
                                                    <span className="min-w-0 whitespace-normal break-words text-right">
                                                        {t1Scorers}
                                                    </span>
                                                    <span className="opacity-50">⚽</span>
                                                    <span className="min-w-0 whitespace-normal break-words text-left">
                                                        {t2Scorers}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-2 sm:pt-3">
                                            <Button variant="secondary" size="sm" className="h-auto py-1 text-[11px] sm:py-1.5 sm:text-xs" onClick={() => setRecordScoreMatchId(m.id)}>
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
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
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

            {editingMatchId && (() => {
                const match = matches.find(m => m.id === editingMatchId)
                if (!match) return null
                return (
                    <EditTournamentMatchModal
                        match={{
                            id: match.id,
                            tournament_id: tournament.id,
                            team_1_id: match.team_1_id,
                            team_2_id: match.team_2_id,
                            match_date: match.match_date,
                        }}
                        teams={teams}
                        onClose={() => setEditingMatchId(null)}
                    />
                )
            })()}


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

            {resetMatchConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isResettingMatch && setResetMatchConfirmId(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Reset Match</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Reset this match back to scheduled with no score? This will remove all player goals and assists recorded for this match and update the fixture and leaderboard tables.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setResetMatchConfirmId(null)} disabled={isResettingMatch}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleResetMatch} disabled={isResettingMatch}>
                                {isResettingMatch ? 'Resetting...' : 'Reset Match'}
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

            {ongoingConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isMarkingOngoing && setOngoingConfirmId(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Mark as Ongoing</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Mark this match as currently ongoing? It will show a pulsing dot in the fixture. Any previously marked ongoing match will be reverted.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setOngoingConfirmId(null)} disabled={isMarkingOngoing}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleMarkOngoing} disabled={isMarkingOngoing}>
                                {isMarkingOngoing ? 'Marking...' : 'Yes, Mark Ongoing'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {unmarkOngoingConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !isMarkingOngoing && setUnmarkOngoingConfirmId(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface-2 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-text-primary">Undo Ongoing</h3>
                        <p className="mt-2 text-sm text-text-muted">
                            Revert this match back to scheduled? The pulsing dot will be removed from the fixture.
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setUnmarkOngoingConfirmId(null)} disabled={isMarkingOngoing}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleUnmarkOngoing} disabled={isMarkingOngoing}>
                                {isMarkingOngoing ? 'Reverting...' : 'Yes, Undo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

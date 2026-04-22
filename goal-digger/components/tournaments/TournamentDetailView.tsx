'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../ui/Card'
import { TournamentStatusBadge } from './TournamentStatusBadge'
import { TournamentDetailActions } from './TournamentDetailActions'
import { EditTournamentModal } from './EditTournamentModal'
import { Button } from '../ui/Button'
import { joinTournament, leaveTournament } from '../../app/actions/tournaments'
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

interface Props {
    tournament: Tournament
    teams: Team[]
    players: TournamentPlayer[]
    matches?: any[]
    matchStats?: any[]
    linkedAuction: { id: string; title: string; status: string } | null
    allAuctions: Auction[]
    allDbPlayers?: { id: string; first_name: string; last_name: string; player_position: string | null; base_score: number; is_guest?: boolean }[]
    isAdmin: boolean
    isPlayer?: boolean
    isManager?: boolean
    hasJoined?: boolean
    currentUserId?: string | null
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
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [leaderboardTab, setLeaderboardTab] = useState<'players' | 'teams' | 'matches'>('teams')
    const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false)
    const [recordScoreMatchId, setRecordScoreMatchId] = useState<string | null>(null)

    // Compute stats
    const completedMatches = matches.filter(m => m.status === 'completed')

    const teamStats = teams.map(team => {
        const teamMatches = completedMatches.filter(m => m.team_1_id === team.id || m.team_2_id === team.id)
        let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
        teamMatches.forEach(m => {
            const isTeam1 = m.team_1_id === team.id
            const myScore = isTeam1 ? m.team_1_score : m.team_2_score
            const theirScore = isTeam1 ? m.team_2_score : m.team_1_score
            gf += myScore
            ga += theirScore
            if (myScore > theirScore) won++
            else if (myScore === theirScore) drawn++
            else lost++
        })
        const gd = gf - ga
        const points = won * 3 + drawn * 1
        return { ...team, played: teamMatches.length, won, drawn, lost, gf, ga, gd, points }
    }).sort((a, b) => b.points - a.points || b.gd - a.gd)

    const playerStats = players.map(player => {
        const pStats = matchStats.filter(ms => ms.player_id === player.player_id)
        const goals = pStats.reduce((acc, curr) => acc + curr.goals, 0)
        const team = teams.find(t => t.id === player.team_id)
        const matchesPlayed = team ? completedMatches.filter(m => m.team_1_id === team.id || m.team_2_id === team.id).length : 0
        return { ...player, goals, matchesPlayed }
    }).sort((a, b) => b.goals - a.goals)

    function toggleTeamPlayers(teamId: string) {
        setExpandedTeams(prev => {
            const next = new Set(prev)
            if (next.has(teamId)) next.delete(teamId)
            else next.add(teamId)
            return next
        })
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
                        {isAdmin && teams.length > 0 && (
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
                                        <div>
                                            <h4 className="font-semibold text-text-primary">{team.team_name}</h4>
                                            {team.team_slogan && (
                                                <p className="text-xs text-text-muted italic">&ldquo;{team.team_slogan}&rdquo;</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-text-muted bg-surface-3 rounded-full px-2 py-0.5">
                                                {teamPlayers.length} players
                                            </span>
                                            {(isAdmin || (isManager && team.manager_id === currentUserId)) && (
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
                                    {profile && (
                                        <div className="flex items-center gap-2 mb-3">
                                            {profile.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover bg-surface-3" />
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                                                </div>
                                            )}
                                            <span className="text-xs text-text-muted">
                                                Manager: <span className="text-text-primary font-medium">{profile.first_name} {profile.last_name}</span>
                                            </span>
                                        </div>
                                    )}
                                    {teamPlayers.length > 0 && (
                                        <div className="mt-2">
                                            <button 
                                                onClick={() => toggleTeamPlayers(team.id)}
                                                className="text-xs text-accent hover:text-accent-hover transition-colors font-medium mb-2"
                                            >
                                                {expandedTeams.has(team.id) ? 'Hide Players' : 'View Players'}
                                            </button>
                                            {expandedTeams.has(team.id) && (
                                                <div className="flex flex-wrap gap-1">
                                                    {teamPlayers.map(tp => {
                                                        const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                                        return (
                                                            <span key={tp.id} className="text-xs bg-surface-3 rounded-full px-2 py-0.5 text-text-muted">
                                                                {p?.first_name} {p?.last_name}
                                                            </span>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {(isAdmin || (isManager && team.manager_id === currentUserId)) && (
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
                            <div className="flex justify-end">
                                <Button size="sm" onClick={() => setIsCreateMatchOpen(true)}>+ Schedule Match</Button>
                            </div>
                        )}
                        {matches.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {matches.map(m => {
                                    const t1 = teams.find(t => t.id === m.team_1_id)
                                    const t2 = teams.find(t => t.id === m.team_2_id)
                                    return (
                                        <Card key={m.id} className="flex flex-col">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs text-text-muted">
                                                    {new Date(m.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-surface-3 text-text-muted' : 'bg-accent/10 text-accent'}`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between flex-1 mb-4">
                                                <div className="flex flex-col items-center flex-1 text-center">
                                                    <span className="font-semibold text-text-primary">{t1?.team_name || 'Unknown'}</span>
                                                    {m.status === 'completed' && <span className="text-2xl font-bold mt-1 text-text-primary">{m.team_1_score}</span>}
                                                </div>
                                                <div className="px-4 text-xs font-medium text-text-muted">VS</div>
                                                <div className="flex flex-col items-center flex-1 text-center">
                                                    <span className="font-semibold text-text-primary">{t2?.team_name || 'Unknown'}</span>
                                                    {m.status === 'completed' && <span className="text-2xl font-bold mt-1 text-text-primary">{m.team_2_score}</span>}
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                <div className="mt-auto pt-3 border-t border-border flex justify-end">
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
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-border bg-surface-2/50 text-xs text-text-muted">
                                    <th className="py-3 px-4 font-medium sticky left-0 bg-surface-2 z-10">Player Name</th>
                                    <th className="py-3 px-4 font-medium">Team Name</th>
                                    <th className="py-3 px-4 font-medium text-center">Goals</th>
                                    <th className="py-3 px-4 font-medium text-center">Matches</th>
                                    <th className="py-3 px-4 font-medium">Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {playerStats.map(tp => {
                                    const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                    const team = Array.isArray(tp.tournament_teams) ? tp.tournament_teams[0] : tp.tournament_teams
                                    return (
                                        <tr key={tp.id} className="hover:bg-surface-2/30 transition-colors">
                                            <td className="py-3 px-4 sticky left-0 bg-surface-2 z-10">
                                                <div className="flex items-center gap-3">
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
                                                    <span className="sm:hidden font-medium text-text-primary">
                                                        {p?.first_name?.split(' ')[0]} {p?.last_name?.trim().charAt(0)}.
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {team ? (
                                                    <span className="text-xs bg-accent/10 text-accent rounded-full px-2.5 py-1">
                                                        {team.team_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-text-primary">{tp.goals}</td>
                                            <td className="py-3 px-4 text-center text-text-muted">{tp.matchesPlayed}</td>
                                            <td className="py-3 px-4">
                                                {p?.player_position ? (
                                                    <span className="text-xs text-text-muted capitalize">{p.player_position}</span>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">-</span>
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
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-border bg-surface-2/50 text-xs text-text-muted">
                                        <th className="py-3 px-4 font-medium text-center w-12">Rank</th>
                                        <th className="py-3 px-4 font-medium sticky left-0 bg-surface-2 z-10">Team Name</th>
                                        <th className="py-3 px-4 font-medium text-center">Played</th>
                                        <th className="py-3 px-4 font-medium text-center">W</th>
                                        <th className="py-3 px-4 font-medium text-center">D</th>
                                        <th className="py-3 px-4 font-medium text-center">L</th>
                                        <th className="py-3 px-4 font-medium text-center">GD</th>
                                        <th className="py-3 px-4 font-medium text-center text-accent">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {teamStats.map((team, idx) => (
                                        <tr key={team.id} className="hover:bg-surface-2/30 transition-colors">
                                            <td className="py-3 px-4 text-center font-semibold text-text-muted">{idx + 1}</td>
                                            <td className="py-3 px-4 sticky left-0 bg-surface-2 z-10">
                                                <div className="font-medium text-text-primary">
                                                    {team.team_name}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center text-text-muted">{team.played}</td>
                                            <td className="py-3 px-4 text-center text-emerald-400">{team.won}</td>
                                            <td className="py-3 px-4 text-center text-yellow-400">{team.drawn}</td>
                                            <td className="py-3 px-4 text-center text-red-400">{team.lost}</td>
                                            <td className="py-3 px-4 text-center text-text-muted">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                                            <td className="py-3 px-4 text-center font-bold text-accent">{team.points}</td>
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
                const currentMatchStats = matchStats.filter(ms => ms.tournament_match_id === match.id)

                return (
                    <RecordMatchScoreModal
                        tournamentId={tournament.id}
                        match={match}
                        team1={t1}
                        team2={t2}
                        team1Players={t1Players}
                        team2Players={t2Players}
                        initialStats={currentMatchStats}
                        onClose={() => setRecordScoreMatchId(null)}
                    />
                )
            })()}
        </div>
    )
}

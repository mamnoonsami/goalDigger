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
    linkedAuction: { id: string; title: string; status: string } | null
    allAuctions: Auction[]
    allDbPlayers?: { id: string; first_name: string; last_name: string; player_position: string | null; base_score: number }[]
    isAdmin: boolean
    isPlayer?: boolean
    isManager?: boolean
    hasJoined?: boolean
    currentUserId?: string | null
}

export function TournamentDetailView({ tournament, teams, players, linkedAuction, allAuctions, allDbPlayers = [], isAdmin, isPlayer = false, isManager = false, hasJoined = false, currentUserId = null }: Props) {
    const router = useRouter()
    const toast = useToast()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isAddPlayersOpen, setIsAddPlayersOpen] = useState(false)
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
    const [isManageTeamsOpen, setIsManageTeamsOpen] = useState(false)
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

    return (
        <div className="flex flex-col gap-6">
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
                                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">{tournament.name}</h1>
                                </div>
                                <div className="hidden sm:block">
                                    <TournamentStatusBadge status={tournament.status} />
                                </div>
                            </div>

                            {/* Actions on top right */}
                            <div className="flex items-center gap-2">
                                {isPlayer && tournament.status !== 'completed' && (
                                    <>
                                        {hasJoined ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    setIsProcessing(true)
                                                    try {
                                                        await leaveTournament(tournament.id)
                                                        toast.warning('Left the tournament')
                                                        router.refresh()
                                                    } catch {
                                                        toast.error('Failed to leave tournament')
                                                    } finally {
                                                        setIsProcessing(false)
                                                    }
                                                }}
                                                disabled={isProcessing}
                                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                                            >
                                                {isProcessing ? 'Leaving...' : 'Leave'}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={async () => {
                                                    setIsProcessing(true)
                                                    try {
                                                        await joinTournament(tournament.id)
                                                        toast.success('Joined tournament!')
                                                        router.refresh()
                                                    } catch {
                                                        toast.error('Failed to join tournament')
                                                    } finally {
                                                        setIsProcessing(false)
                                                    }
                                                }}
                                                disabled={isProcessing}
                                                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0 h-8 px-4"
                                            >
                                                {isProcessing ? 'Joining...' : 'Join Tournament'}
                                            </Button>
                                        )}
                                    </>
                                )}

                                {isAdmin && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="text-accent hover:text-accent-hover hover:bg-accent/10"
                                            title="Edit Tournament"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                                        </Button>
                                        <TournamentDetailActions tournamentId={tournament.id} />
                                    </>
                                )}
                            </div>
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
                                        🔗 {linkedAuction.title}
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
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

            {/* Players Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">⚽ Players ({players.length})</h3>
                    {isAdmin && (
                        <Button
                            size="sm"
                            onClick={() => setIsAddPlayersOpen(true)}
                            className="text-xs"
                        >
                            Manage Players
                        </Button>
                    )}
                </div>
                {players.length > 0 ? (
                    <Card>
                        <div className="divide-y divide-border">
                            {players.map(tp => {
                                const p = Array.isArray(tp.profiles) ? tp.profiles[0] : tp.profiles
                                const team = Array.isArray(tp.tournament_teams) ? tp.tournament_teams[0] : tp.tournament_teams
                                return (
                                    <div key={tp.id} className="flex items-center gap-3 py-2.5">
                                        {p?.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover bg-surface-3" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                                                {p?.first_name?.[0]}{p?.last_name?.[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-text-primary">
                                                {p?.first_name} {p?.last_name}
                                            </span>
                                            {p?.player_position && (
                                                <span className="ml-2 text-xs text-text-muted capitalize">{p.player_position}</span>
                                            )}
                                        </div>
                                        {team && (
                                            <span className="text-xs bg-accent/10 text-accent rounded-full px-2 py-0.5">
                                                {team.team_name}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <p className="py-6 text-center text-sm text-text-muted">No players assigned yet.</p>
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
                        }}
                        onClose={() => setEditingTeamId(null)}
                    />
                )
            })()}
        </div>
    )
}

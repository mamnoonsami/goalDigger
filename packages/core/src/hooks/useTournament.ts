import { useQuery } from '@tanstack/react-query'
import {
    getTournaments,
    getTournamentById,
    getTournamentPlayers,
} from '../services/tournament.service'

export const tournamentKeys = {
    all: ['tournaments'] as const,
    byId: (id: string) => ['tournament', id] as const,
    players: (id: string) => ['tournament', id, 'players'] as const,
}

export function useTournaments() {
    return useQuery({
        queryKey: tournamentKeys.all,
        queryFn: getTournaments,
        staleTime: 1000 * 60,
    })
}

export function useTournament(id: string) {
    return useQuery({
        queryKey: tournamentKeys.byId(id),
        queryFn: () => getTournamentById(id),
        enabled: !!id,
    })
}

export function useTournamentPlayers(tournamentId: string) {
    return useQuery({
        queryKey: tournamentKeys.players(tournamentId),
        queryFn: () => getTournamentPlayers(tournamentId),
        enabled: !!tournamentId,
    })
}

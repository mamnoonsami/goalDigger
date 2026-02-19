import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getMatches,
    getMatchById,
    getMatchSignups,
    signUpForMatch,
    withdrawFromMatch,
    generateAndSaveTeams,
    recordMatchStats,
} from '../services/match.service'
import type { RecordStatPayload } from '../types/match.types'

export const matchKeys = {
    all: ['matches'] as const,
    byId: (id: string) => ['match', id] as const,
    signups: (id: string) => ['match', id, 'signups'] as const,
}

export function useMatches() {
    return useQuery({
        queryKey: matchKeys.all,
        queryFn: getMatches,
        staleTime: 1000 * 30,
    })
}

export function useMatch(id: string) {
    return useQuery({
        queryKey: matchKeys.byId(id),
        queryFn: () => getMatchById(id),
        enabled: !!id,
    })
}

export function useMatchSignups(matchId: string) {
    return useQuery({
        queryKey: matchKeys.signups(matchId),
        queryFn: () => getMatchSignups(matchId),
        enabled: !!matchId,
        refetchInterval: 10_000, // poll every 10s for new sign-ups
    })
}

export function useSignUpForMatch(matchId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => signUpForMatch(matchId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: matchKeys.signups(matchId) })
        },
    })
}

export function useWithdrawFromMatch(matchId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => withdrawFromMatch(matchId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: matchKeys.signups(matchId) })
        },
    })
}

/** Admin: generate balanced teams and persist them */
export function useGenerateTeams(matchId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => generateAndSaveTeams(matchId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: matchKeys.signups(matchId) })
            qc.invalidateQueries({ queryKey: matchKeys.byId(matchId) })
        },
    })
}

/** Admin: record match stats and update career totals */
export function useRecordStats(matchId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (stats: RecordStatPayload[]) =>
            recordMatchStats(matchId, stats),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: matchKeys.byId(matchId) })
            // Profiles have changed (goals count) so invalidate
            qc.invalidateQueries({ queryKey: ['profiles'] })
        },
    })
}

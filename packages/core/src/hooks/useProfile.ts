import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getMyProfile,
    getAllProfiles,
    updateBaseScore,
    updateUserRole,
} from '../services/profile.service'
import type { UserRole } from '../types/profile.types'

export const profileKeys = {
    me: ['profile', 'me'] as const,
    all: ['profiles'] as const,
    byId: (id: string) => ['profile', id] as const,
}

export function useMyProfile() {
    return useQuery({
        queryKey: profileKeys.me,
        queryFn: getMyProfile,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export function useAllProfiles() {
    return useQuery({
        queryKey: profileKeys.all,
        queryFn: getAllProfiles,
        staleTime: 1000 * 30,
    })
}

/** Admin mutation: set a player's base_score */
export function useUpdateBaseScore() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ playerId, score }: { playerId: string; score: number }) =>
            updateBaseScore(playerId, score),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: profileKeys.all })
        },
    })
}

/** Admin mutation: change a user's role */
export function useUpdateRole() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
            updateUserRole(userId, role),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: profileKeys.all })
        },
    })
}

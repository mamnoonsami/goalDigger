import { createClient } from '../lib/supabase/client'
import type { Profile } from '../types/profile.types'

/**
 * Fetch the currently authenticated user's profile.
 */
export async function getMyProfile(): Promise<Profile | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return data ?? null
}

/**
 * Fetch any profile by ID.
 */
export async function getProfileById(id: string): Promise<Profile | null> {
    const supabase = createClient()
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
    return data ?? null
}

/**
 * Fetch all profiles (admin: player roster view).
 */
export async function getAllProfiles(): Promise<Profile[]> {
    const supabase = createClient()
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('base_score', { ascending: false })
    return data ?? []
}

/**
 * Admin: update a player's base_score (1–100).
 */
export async function updateBaseScore(
    playerId: string,
    baseScore: number
): Promise<void> {
    const supabase = createClient()
    await supabase
        .from('profiles')
        .update({ base_score: baseScore, updated_at: new Date().toISOString() })
        .eq('id', playerId)
}

/**
 * Admin: update a user's role.
 */
export async function updateUserRole(
    userId: string,
    role: Profile['role']
): Promise<void> {
    const supabase = createClient()
    await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
}

/**
 * Update avatar URL for own profile.
 */
export async function updateAvatar(
    userId: string,
    avatarUrl: string
): Promise<void> {
    const supabase = createClient()
    await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
}

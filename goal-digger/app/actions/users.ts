'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Guard: throw if the current user is not an admin */
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) throw new Error('Only admins can manage users')
    return { supabase, userId: user.id }
}

/** Fetch every profile (admin only) */
export async function getUsers() {
    const { supabase } = await requireAdmin()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, is_admin, is_manager, is_player, is_viewer, player_position, base_score, goals, matches_played, auction_budget, created_at, updated_at')
        .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
}

/** Update a user profile (admin only) */
export async function updateUser(
    id: string,
    data: {
        first_name?: string
        last_name?: string
        role?: string
        is_admin?: boolean
        is_manager?: boolean
        is_player?: boolean
        is_viewer?: boolean
        player_position?: string | null
        base_score?: number
        auction_budget?: number
    }
) {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/users')
    revalidatePath('/players')
    revalidatePath('/dashboard')
}

/** Delete a user profile (admin only, cannot self-delete) */
export async function deleteUser(id: string) {
    const { supabase, userId } = await requireAdmin()

    if (id === userId) throw new Error('You cannot delete your own account')

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/users')
    revalidatePath('/players')
    revalidatePath('/dashboard')
}

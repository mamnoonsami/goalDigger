'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** User updates their own profile */
export async function updateProfile(data: {
    first_name?: string
    last_name?: string
    player_position?: string | null
    avatar_url?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    // Auto-promote to player when a position is selected
    const updateData: Record<string, unknown> = { ...data }
    if (data.player_position && data.player_position.trim() !== '') {
        updateData.is_player = true
        updateData.role = 'player'
    }

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/players')
}

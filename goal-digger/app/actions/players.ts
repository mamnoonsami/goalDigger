'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Admin: update a player's profile */
export async function updatePlayer(
    playerId: string,
    data: {
        first_name?: string
        last_name?: string
        player_position?: string | null
        base_score?: number
        goals?: number
        matches_played?: number
        role?: string
    }
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', playerId)

    if (error) throw new Error(error.message)

    revalidatePath(`/players/${playerId}`)
    revalidatePath('/players')
    revalidatePath('/dashboard')
}

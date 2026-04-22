'use server'

import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/* ── Create Guest Profile ── */
export async function createGuestProfile(data: {
    first_name: string
    last_name: string
    player_position?: string | null
}) {
    // Verify the caller is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()
    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can create guest profiles')

    // Use admin client to bypass RLS for the insert
    const adminClient = createAdminClient()

    const { data: guestProfile, error } = await adminClient
        .from('profiles')
        .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            player_position: data.player_position || null,
            is_guest: true,
            is_player: true,
            role: 'player',
        })
        .select('id, first_name, last_name, player_position, base_score')
        .single()

    if (error) throw new Error(`Failed to create guest profile: ${error.message}`)

    revalidatePath('/tournaments')
    return guestProfile
}

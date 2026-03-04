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

    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/players')
}

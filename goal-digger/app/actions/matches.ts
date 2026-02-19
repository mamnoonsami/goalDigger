'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMatch(id: string, data: { location?: string; scheduled_at?: string }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('matches')
        .update(data)
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/matches')
    revalidatePath(`/matches/${id}`)
}

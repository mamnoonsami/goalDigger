import { cache } from 'react'
import { createClient } from './server'

export interface CurrentUserSession {
    user: any | null
    profile: {
        id: string
        first_name: string
        last_name: string
        nickname?: string | null
        avatar_url: string | null
        role: string
        is_admin: boolean
        is_king: boolean
        is_manager: boolean
        is_player: boolean
        is_viewer: boolean
        is_active: boolean
        tenant_id: string | null
        last_read_chat_at?: string | null
    } | null
}

/**
 * React request-memoized current user & profile retriever.
 * Guarantees a single DB request per HTTP request render cycle.
 */
export const getCurrentUserProfile = cache(async (): Promise<CurrentUserSession> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return { user, profile }
})

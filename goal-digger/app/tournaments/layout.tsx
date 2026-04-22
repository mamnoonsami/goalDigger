import type { ReactNode } from 'react'
import { createClient } from '../../lib/supabase/server'
import { AppShell } from '../../components/layout/AppShell'

export default async function TournamentsLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    let unreadCount = 0

    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, is_admin, is_king, is_player, is_manager, last_read_chat_at')
            .eq('id', user.id)
            .single()
        profile = data

        const lastRead = profile?.last_read_chat_at ?? new Date(0).toISOString()
        const { count } = await supabase
            .from('global_messages')
            .select('id', { count: 'exact', head: true })
            .gt('created_at', lastRead)
        unreadCount = count ?? 0
    }

    return (
        <AppShell
            profile={profile}
            isAdmin={profile?.is_admin || profile?.is_king || false}
            isPlayer={profile?.is_player ?? false}
            isManager={profile?.is_manager ?? false}
            initialUnreadCount={unreadCount}
        >
            {children}
        </AppShell>
    )
}

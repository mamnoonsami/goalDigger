import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '../../lib/supabase/server'
import { getCurrentUserProfile } from '../../lib/supabase/getCurrentUser'
import { AppShell } from '../../components/layout/AppShell'

export default async function AppLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()

    // Verify session — middleware handles the redirect but this is a safety net
    const { user, profile } = await getCurrentUserProfile()
    if (!user) redirect('/login')

    // Compute initial unread count server-side (messages newer than last_read_chat_at)
    const lastRead = profile?.last_read_chat_at ?? new Date(0).toISOString()
    const { count: unreadCount } = await supabase
        .from('global_messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', lastRead)

    return (
        <AppShell
            profile={profile}
            isAdmin={profile?.is_admin || profile?.is_king || false}
            isKing={profile?.is_king ?? false}
            isPlayer={profile?.is_player ?? false}
            isManager={profile?.is_manager ?? false}
            initialUnreadCount={unreadCount ?? 0}
        >
            {children}
        </AppShell>
    )
}

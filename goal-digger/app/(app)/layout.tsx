import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '../../lib/supabase/server'
import { AppShell } from '../../components/layout/AppShell'

export default async function AppLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()

    // Verify session — middleware handles the redirect but this is a safety net
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch profile for topbar
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single()

    return <AppShell profile={profile}>{children}</AppShell>
}

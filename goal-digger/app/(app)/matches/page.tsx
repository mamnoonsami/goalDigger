import { createClient } from '../../../lib/supabase/server'
import { MatchesTabs, MatchItem } from '../../../components/matches/MatchesTabs'

export default async function MatchesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin || profile?.is_king || false

    const { data: queriedMatches } = await supabase
        .from('matches')
        .select('id, title, status, scheduled_at, location, max_players, created_at')
        .order('created_at', { ascending: false })

    const matches: MatchItem[] = [...(queriedMatches ?? [])].sort((a, b) => {
        const priority: Record<string, number> = { open: 1, completed: 3 }
        const pA = priority[a.status] || 2
        const pB = priority[b.status] || 2
        if (pA !== pB) return pA - pB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return <MatchesTabs matches={matches} isAdmin={isAdmin} />
}

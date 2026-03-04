import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTournamentForm } from '../../../../components/tournaments/CreateTournamentForm'

export const dynamic = 'force-dynamic'

export default async function CreateTournamentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) redirect('/tournaments')

    // Fetch auctions for optional linking
    const { data: auctions } = await supabase
        .from('auctions')
        .select('id, title, status')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Create Tournament</h1>
                <p className="mt-1 text-sm text-text-muted">Set up a new tournament event.</p>
            </div>

            <CreateTournamentForm auctions={auctions ?? []} />
        </div>
    )
}

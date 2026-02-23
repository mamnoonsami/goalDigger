import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateAuctionForm } from '../../../../components/auctions/CreateAuctionForm'

export const dynamic = 'force-dynamic'

export default async function CreateAuctionPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) redirect('/auctions')

    // Fetch all players for selection
    const { data: players } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, player_position, base_score')
        .eq('is_player', true)
        .order('first_name', { ascending: true })

    // Fetch all managers for optional assignment
    const { data: managers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_manager', true)
        .order('first_name', { ascending: true })

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Create Auction</h1>
                <p className="mt-1 text-sm text-text-muted">Set up a new player auction event.</p>
            </div>

            <CreateAuctionForm players={players ?? []} managers={managers ?? []} />
        </div>
    )
}

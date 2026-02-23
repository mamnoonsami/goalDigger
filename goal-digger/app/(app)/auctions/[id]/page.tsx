import { createClient } from '../../../../lib/supabase/server'
import { Card } from '../../../../components/ui/Card'
import { AuctionDetailActions } from '../../../../components/auctions/AuctionDetailActions'
import { AuctionHeader } from '../../../../components/auctions/AuctionHeader'
import { AuctionWorkspace } from '../../../../components/auctions/AuctionWorkspace'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function AuctionDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const [
        { data: { user } },
        { data: auction },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('auctions').select('*').eq('id', id).single(),
    ])

    if (!auction) notFound()

    // Check role details
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_manager')
        .eq('id', user!.id)
        .single()

    const isAdmin = profile?.is_admin ?? false
    const isManager = profile?.is_manager ?? false

    // Check if current user has joined this auction as manager
    let hasJoined = false
    if (isManager) {
        const { count } = await supabase
            .from('auction_managers')
            .select('*', { count: 'exact', head: true })
            .eq('auction_id', id)
            .eq('manager_id', user!.id)
        hasJoined = (count ?? 0) > 0
    }

    // Fetch auction players with profile data
    const { data: auctionPlayers, error: apError } = await supabase
        .from('auction_players')
        .select('id, player_id, base_price, sold_to, sold_price, status, display_order, profiles!player_id(first_name, last_name, player_position, base_score, avatar_url)')
        .eq('auction_id', id)
        .order('display_order', { ascending: true })

    console.log('--- FETCH AUCTION PLAYERS ---')
    console.log('Error:', apError)
    console.log('Data:', JSON.stringify(auctionPlayers, null, 2))

    // Fetch managers who joined the auction
    const { data: auctionManagers, error: amError } = await supabase
        .from('auction_managers')
        .select(`
            manager_id,
            profiles!manager_id(first_name, last_name, avatar_url)
        `)
        .eq('auction_id', id)

    const managers = (auctionManagers ?? []).map(am => {
        const profile = Array.isArray(am.profiles) ? am.profiles[0] : am.profiles;
        return {
            id: am.manager_id,
            first_name: profile?.first_name ?? 'Unknown',
            last_name: profile?.last_name ?? '',
            avatar_url: profile?.avatar_url ?? null,
        }
    })

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-3 text-text-muted',
        live: 'bg-emerald-500/15 text-emerald-400',
        completed: 'bg-blue-500/15 text-blue-400',
    }

    // Prepare players for spin wheel (pending or unsold)
    const pendingForSpin = (auctionPlayers ?? [])
        .filter((p: any) => p.status === 'pending' || p.status === 'unsold')
        .map((p: any) => {
            const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            return {
                id: p.player_id,
                name: `${profile?.first_name} ${profile?.last_name}`,
                position: profile?.player_position ?? null,
            };
        })

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/auctions" className="hover:text-accent transition-colors">Auctions</Link>
                <span>/</span>
                <span className="text-text-primary font-medium">{auction.title}</span>
            </div>

            {/* Auction Header */}
            <AuctionHeader
                auction={auction}
                isAdmin={isAdmin}
                isManager={isManager}
                hasJoined={hasJoined}
                playerCount={auctionPlayers?.length ?? 0}
            />

            <AuctionWorkspace
                auctionId={id}
                isAdmin={isAdmin}
                pendingForSpin={pendingForSpin}
                auctionPlayers={auctionPlayers ?? []}
                managers={managers}
                budgetPerManager={auction.budget_per_manager}
            />
        </div>
    )
}

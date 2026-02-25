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
        { data: auctionPlayers },
        { data: auctionManagers },
        { data: profile }
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('auctions').select('*').eq('id', id).single(),
        supabase.from('auction_players')
            .select('id, player_id, base_price, sold_to, sold_price, status, display_order, profiles!player_id(first_name, last_name, player_position, base_score, avatar_url)')
            .eq('auction_id', id)
            .order('display_order', { ascending: true }),
        supabase.from('auction_managers')
            .select(`
                    manager_id,
                    profiles!manager_id(first_name, last_name, avatar_url)
                `)
            .eq('auction_id', id),
        // Look up the profile specifically for the context user to check roles
        (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null }
            return supabase.from('profiles').select('is_admin, is_manager').eq('id', user.id).single()
        })()
    ])

    if (!auction) notFound()

    const isAdmin = profile?.is_admin ?? false
    const isManager = profile?.is_manager ?? false

    // Conditionally fetch "ALL" players and managers only if Admin, to populate the manage Modals
    let allDbPlayers: any[] = []
    let allDbManagers: any[] = []
    if (isAdmin) {
        const [playersRes, managersRes] = await Promise.all([
            supabase.from('profiles')
                .select('id, first_name, last_name, player_position, base_score')
                .eq('is_player', true)
                .order('base_score', { ascending: false }),
            supabase.from('profiles')
                .select('id, first_name, last_name')
                .eq('is_manager', true)
                .order('first_name', { ascending: true })
        ])
        allDbPlayers = playersRes.data || []
        allDbManagers = managersRes.data || []
    }

    // Check if current user has joined this auction as manager
    let hasJoined = false
    if (isManager && user) {
        const { count } = await supabase
            .from('auction_managers')
            .select('*', { count: 'exact', head: true })
            .eq('auction_id', id)
            .eq('manager_id', user.id)
        hasJoined = (count ?? 0) > 0
    }

    const managers = (auctionManagers ?? []).map(am => {
        const profileData = Array.isArray(am.profiles) ? am.profiles[0] : am.profiles;
        return {
            id: am.manager_id,
            first_name: profileData?.first_name ?? 'Unknown',
            last_name: profileData?.last_name ?? '',
            avatar_url: profileData?.avatar_url ?? null,
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
            const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            return {
                id: p.player_id,
                name: `${profileData?.first_name} ${profileData?.last_name}`,
                position: profileData?.player_position ?? null,
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
                allDbPlayers={allDbPlayers}
                allDbManagers={allDbManagers}
                managers={managers}
                budgetPerManager={auction.budget_per_manager}
                maxPlayersPerTeam={auction.max_players_per_team}
            />
        </div>
    )
}

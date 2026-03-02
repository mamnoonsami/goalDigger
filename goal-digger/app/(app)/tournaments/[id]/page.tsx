import { createClient } from '../../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TournamentDetailView } from '../../../../components/tournaments/TournamentDetailView'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TournamentDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const [
        { data: { user } },
        { data: tournament },
        { data: teams },
        { data: players },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('tournament_teams')
            .select('id, team_name, team_slogan, number_of_players, manager_id, profiles!manager_id(first_name, last_name, avatar_url)')
            .eq('tournament_id', id)
            .order('created_at', { ascending: true }),
        supabase.from('tournament_players')
            .select('id, player_id, team_id, profiles!player_id(first_name, last_name, player_position, avatar_url), tournament_teams!team_id(team_name)')
            .eq('tournament_id', id),
    ])

    if (!tournament) notFound()

    // Get user roles
    const { data: profile } = user
        ? await supabase.from('profiles').select('is_admin, is_player').eq('id', user.id).single()
        : { data: null }

    const isAdmin = profile?.is_admin ?? false
    const isPlayer = profile?.is_player ?? false

    // Check if current user has joined this tournament
    let hasJoined = false
    if (isPlayer && user) {
        const { count } = await supabase
            .from('tournament_players')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', id)
            .eq('player_id', user.id)
        hasJoined = (count ?? 0) > 0
    }

    // Fetch linked auction info
    let linkedAuction = null
    if (tournament.auction_id) {
        const { data } = await supabase
            .from('auctions')
            .select('id, title, status')
            .eq('id', tournament.auction_id)
            .single()
        linkedAuction = data
    }

    // Fetch all auctions for the edit dropdown + all players for add-player modal
    let allAuctions: { id: string; title: string; status: string }[] = []
    let allDbPlayers: { id: string; first_name: string; last_name: string; player_position: string | null; base_score: number }[] = []
    if (isAdmin) {
        const [auctionsRes, playersRes] = await Promise.all([
            supabase.from('auctions').select('id, title, status').order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, first_name, last_name, player_position, base_score').eq('is_player', true).order('first_name', { ascending: true }),
        ])
        allAuctions = auctionsRes.data ?? []
        allDbPlayers = playersRes.data ?? []
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/tournaments" className="hover:text-accent transition-colors">Tournaments</Link>
                <span>/</span>
                <span className="text-text-primary font-medium">{tournament.name}</span>
            </div>

            <TournamentDetailView
                tournament={tournament}
                teams={teams ?? []}
                players={players ?? []}
                linkedAuction={linkedAuction}
                allAuctions={allAuctions}
                allDbPlayers={allDbPlayers}
                isAdmin={isAdmin}
                isPlayer={isPlayer}
                hasJoined={hasJoined}
            />
        </div>
    )
}

import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Badge, roleVariant } from '../../../components/ui/Badge'
import { ProfileForm } from '../../../components/profile/ProfileForm'
import { PeerRatingStatCard } from '../../../components/profile/PeerRatingStatCard'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played, created_at, peer_rating_score')
        .eq('id', user!.id)
        .single()

    if (!profile) {
        return (
            <Card>
                <p className="text-center text-sm text-text-muted py-10">
                    Profile not found. Please contact an administrator.
                </p>
            </Card>
        )
    }

    // --- ANONYMOUS RATING ANALYTICS ---
    const { data: myRatingsData } = await supabase
        .from('player_ratings')
        .select('rating, rater_id')
        .eq('ratee_id', user!.id)

    const ratingsRaw = myRatingsData || []
    const raterIds = ratingsRaw.map((r) => r.rater_id)

    let raterProfiles: any[] = []
    if (raterIds.length > 0) {
        const { data } = await supabase
            .from('profiles')
            .select('id, player_position')
            .in('id', raterIds)
        raterProfiles = data || []
    }

    const ratingsWithPos = ratingsRaw.map((r) => ({
        rating: r.rating,
        position: raterProfiles.find((p) => p.id === r.rater_id)?.player_position || 'other'
    }))

    const totalRatings = ratingsWithPos.length
    let globalAverage: number | null = null
    let highestRating: number | null = null
    let highestRatingPosition: string | null = null
    const posAverages = {
        striker: null as number | null,
        midfielder: null as number | null,
        defender: null as number | null,
        goalkeeper: null as number | null
    }

    if (totalRatings > 0) {
        const sum = ratingsWithPos.reduce((acc, curr) => acc + curr.rating, 0)
        globalAverage = Math.round((sum / totalRatings) * 100) / 100

        highestRating = Math.max(...ratingsWithPos.map(r => r.rating))
        highestRatingPosition = ratingsWithPos.find(r => r.rating === highestRating)?.position || 'player'

        const calcAvg = (pos: string) => {
            const matches = ratingsWithPos.filter(r => r.position === pos)
            if (matches.length === 0) return null
            return Math.round((matches.reduce((acc, curr) => acc + curr.rating, 0) / matches.length) * 100) / 100
        }

        posAverages.striker = calcAvg('striker')
        posAverages.midfielder = calcAvg('midfielder')
        posAverages.defender = calcAvg('defender')
        posAverages.goalkeeper = calcAvg('goalkeeper')
    }

    const analyticsPayload = {
        totalRatings,
        globalAverage,
        highestRating,
        highestRatingPosition,
        averagesByPosition: posAverages
    }

    // Calculate system-wide global average across all players
    let systemGlobalAverage: number | null = null
    const { data: allRatedProfiles } = await supabase
        .from('profiles')
        .select('peer_rating_score')
        .not('peer_rating_score', 'is', null)

    if (allRatedProfiles && allRatedProfiles.length > 0) {
        const sum = allRatedProfiles.reduce((acc, curr) => acc + (curr.peer_rating_score || 0), 0)
        systemGlobalAverage = Math.round((sum / allRatedProfiles.length) * 100) / 100
    }
    
    // Add system global to payload
    Object.assign(analyticsPayload, { systemGlobalAverage })

    const effectiveScore = profile.base_score + profile.goals * 2

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
                <p className="mt-1 text-sm text-text-muted">Update your personal information and avatar.</p>
            </div>

            {/* Read-only stats row */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-accent font-mono">{effectiveScore}</span>
                    <span className="text-xs text-text-muted mt-1">Effective Score</span>
                </Card>
                <PeerRatingStatCard 
                    peerScore={profile.peer_rating_score ?? '-'} 
                    analytics={analyticsPayload} 
                    valueGradient="from-amber-700 to-amber-900 dark:from-amber-500 dark:to-amber-700" 
                />
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-text-primary font-mono">{profile.base_score}</span>
                    <span className="text-xs text-text-muted mt-1">Base Score</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-text-primary font-mono">{profile.goals}</span>
                    <span className="text-xs text-text-muted mt-1">Goals</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-text-primary font-mono">{profile.matches_played}</span>
                    <span className="text-xs text-text-muted mt-1">Matches</span>
                </Card>
            </div>

            {/* Editable profile form */}
            <Card>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-text-primary">Personal Information</h2>
                    <Badge variant={roleVariant[profile.role] ?? 'slate'}>
                        {profile.role}
                    </Badge>
                </div>
                <ProfileForm profile={profile} goals={profile.goals} />
            </Card>

            {/* Account info (read-only) */}
            <Card>
                <h2 className="font-semibold text-text-primary mb-3">Account</h2>
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-text-muted">Email</span>
                        <span className="text-text-primary">{user!.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-muted">Member since</span>
                        <span className="text-text-primary">
                            {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    )
}

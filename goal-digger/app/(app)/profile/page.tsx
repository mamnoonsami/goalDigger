import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Badge, roleVariant } from '../../../components/ui/Badge'
import { ProfileForm } from '../../../components/profile/ProfileForm'
import { ProfilePhotoManager } from '../../../components/profile/ProfilePhotoManager'
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

    let raterProfiles: { id: string; player_position: string | null }[] = []
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
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Account settings</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">My profile.</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Manage how you appear to your squad and review your current performance.</p>
            </div>

            <Card className="relative p-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/[0.18] via-accent/[0.03] to-transparent" />
                <div className="relative p-5 sm:p-7">
                    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                        <ProfilePhotoManager
                            firstName={profile.first_name}
                            lastName={profile.last_name}
                            initialAvatarUrl={profile.avatar_url}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                                <h2 className="break-words text-balance text-2xl font-semibold leading-tight tracking-[-0.04em] text-text-primary sm:text-3xl">{profile.first_name} {profile.last_name}</h2>
                                <Badge variant={roleVariant[profile.role] ?? 'slate'}>{profile.role}</Badge>
                            </div>
                            <p className="mt-1.5 text-sm font-medium capitalize text-text-muted">{profile.player_position ?? 'No position set'}</p>
                            <p className="mt-1 text-xs text-text-muted">Squad member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
                <Card className="flex min-h-24 flex-col justify-center p-4 sm:p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Effective score</span>
                    <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-accent">{effectiveScore}</span>
                </Card>
                <PeerRatingStatCard peerScore={profile.peer_rating_score ?? '—'} analytics={analyticsPayload} />
                <Card className="flex min-h-24 flex-col justify-center p-4 sm:p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Base score</span>
                    <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">{profile.base_score}</span>
                </Card>
                <Card className="flex min-h-24 flex-col justify-center p-4 sm:p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Goals</span>
                    <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">{profile.goals}</span>
                </Card>
                <Card className="col-span-2 flex min-h-24 flex-col justify-center p-4 sm:col-span-1 sm:p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Matches</span>
                    <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary">{profile.matches_played}</span>
                </Card>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:gap-6">
                <Card className="overflow-hidden p-0">
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Personal details</p>
                        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-text-primary">Profile appearance</h2>
                        <p className="mt-1 text-sm text-text-muted">Review your name and update your playing position.</p>
                    </div>
                    <div className="p-5 sm:p-6">
                        <ProfileForm profile={profile} />
                    </div>
                </Card>

                <Card className="overflow-hidden p-0">
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Account</p>
                        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-text-primary">Sign-in details</h2>
                    </div>
                    <dl className="divide-y divide-border px-5 sm:px-6">
                        <div className="py-4">
                            <dt className="text-xs font-medium text-text-muted">Email address</dt>
                            <dd className="mt-1 break-all text-sm font-medium text-text-primary">{user!.email}</dd>
                        </div>
                        <div className="py-4">
                            <dt className="text-xs font-medium text-text-muted">Member since</dt>
                            <dd className="mt-1 text-sm font-medium text-text-primary">{new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</dd>
                        </div>
                        <div className="py-4">
                            <dt className="text-xs font-medium text-text-muted">Account role</dt>
                            <dd className="mt-2"><Badge variant={roleVariant[profile.role] ?? 'slate'}>{profile.role}</Badge></dd>
                        </div>
                    </dl>
                </Card>
            </div>
        </div>
    )
}

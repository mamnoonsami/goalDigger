import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { getPlayersToRate, getMyRatings } from '../../actions/ratings'
import RatingsClient from './RatingsClient'
import RatingsBanner from './RatingsBanner'
import { Card } from '../../../components/ui/Card'

export default async function RatingsPage() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    if (!profile.is_admin && !profile.is_player && !profile.is_manager) {
        redirect('/dashboard')
    }

    const players = await getPlayersToRate()
    const myRatings = await getMyRatings()

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            <div>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">Player Ratings</h1>
                    {profile.is_king && (
                        <Link href="/ratings/analytics" className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors rounded-md text-accent text-sm font-semibold flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent focus-visible:ring-offset-surface-1">
                            📊 View Analytics
                        </Link>
                    )}
                </div>
                <p className="mt-1 text-sm text-text-muted mb-4">
                    Rate other players from 30 to 100 based on their performance.
                </p>

                <RatingsBanner />
            </div>

            {players.length === 0 ? (
                <Card>
                    <p className="p-10 text-center text-sm text-text-muted">
                        No other players available to rate at the moment.
                    </p>
                </Card>
            ) : (
                <RatingsClient players={players} myRatings={myRatings} />
            )}
        </div>
    )
}

import { redirect } from 'next/navigation'
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

    if (!profile.is_admin) {
        redirect('/dashboard')
    }

    const players = await getPlayersToRate()
    const myRatings = await getMyRatings()

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Player Ratings</h1>
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

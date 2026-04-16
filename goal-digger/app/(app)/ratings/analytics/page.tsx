import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import { getAllRatingsAdmin } from '../../../actions/ratings'
import AnalyticsClient from './AnalyticsClient'
import Link from 'next/link'

export default async function RatingsAnalyticsPage() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_king')
        .eq('id', userData.user.id)
        .single()

    if (!profile?.is_king) {
        redirect('/dashboard') // Kings only!
    }

    const ratingsResponse = await getAllRatingsAdmin()

    if (ratingsResponse.error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-3xl mb-4">🚨</span>
                <h2 className="text-xl font-bold text-text-primary">Error loading analytics</h2>
                <p className="text-sm text-text-muted mt-2">{ratingsResponse.error}</p>
                <Link href="/ratings" className="mt-6 text-accent hover:underline text-sm font-medium">
                    ← Back to Ratings
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            <div>
                <Link href="/ratings" className="text-xs text-text-muted hover:text-accent font-medium mb-3 inline-flex items-center gap-1 transition-colors">
                    <span aria-hidden="true">←</span> Back to Ratings
                </Link>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <span aria-hidden="true">📊</span> Ratings Analytics
                </h1>
                <p className="mt-1 text-sm text-text-muted mb-4">
                    Monitor rater participation and view the final calculated leaderboard.
                </p>
            </div>

            <AnalyticsClient rawRatings={ratingsResponse.data || []} />
        </div>
    )
}

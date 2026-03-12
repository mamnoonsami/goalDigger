'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Fetch all profiles with the 'is_player' flag set to true, except the current logged-in user.
 * Return minimal necessary data for rating.
 */
export async function getPlayersToRate() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) return []

    const { data: players, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, player_position')
        .eq('is_player', true)
        .neq('id', myId)
        .order('first_name')

    if (error) {
        console.error('Error fetching players to rate:', error.message)
        return []
    }

    return players || []
}

/**
 * Fetch all existing ratings submitted by the current user.
 */
export async function getMyRatings() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) return []

    const { data: ratings, error } = await supabase
        .from('player_ratings')
        .select('ratee_id, rating')
        .eq('rater_id', myId)

    if (error) {
        console.error('Error fetching my ratings:', error.message)
        return []
    }

    return ratings || []
}

/**
 * Submit or update a rating for a specific player
 */
export async function submitRating(rateeId: string, rating: number) {
    if (rating < 30 || rating > 100) {
        return { error: 'Rating must be between 30 and 100.' }
    }

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) {
        return { error: 'Not authenticated.' }
    }

    if (myId === rateeId) {
        return { error: 'You cannot rate yourself.' }
    }

    const { error } = await supabase
        .from('player_ratings')
        .upsert({
            rater_id: myId,
            ratee_id: rateeId,
            rating,
            updated_at: new Date().toISOString()
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/ratings')
    return { success: true }
}

/**
 * Submit or update multiple ratings at once
 */
export async function submitAllRatings(ratings: { rateeId: string; rating: number }[]) {
    if (!ratings || ratings.length === 0) return { success: true }

    // Validate bounds
    for (const r of ratings) {
        if (r.rating < 30 || r.rating > 100) {
            return { error: 'All ratings must be between 30 and 100.' }
        }
    }

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) {
        return { error: 'Not authenticated.' }
    }

    // Check self-rating
    for (const r of ratings) {
        if (myId === r.rateeId) {
            return { error: 'You cannot rate yourself.' }
        }
    }

    const payload = ratings.map(r => ({
        rater_id: myId,
        ratee_id: r.rateeId,
        rating: r.rating,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from('player_ratings')
        .upsert(payload)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/ratings')
    return { success: true }
}

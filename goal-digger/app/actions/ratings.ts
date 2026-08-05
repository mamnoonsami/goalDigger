'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Fetch all profiles with the 'is_player' flag set to true, except the current logged-in user.
 * Return minimal necessary data for rating.
 */
export async function getPlayersToRate() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) return []

    const { data: myProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', myId)
        .single()

    const { data: players, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, player_position')
        .eq('is_player', true)
        .eq('is_active', true)
        .eq('tenant_id', myProfile?.tenant_id)
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

/**
 * Admin Action: Fetch all ratings from all users with ratee and rater profile data.
 * Merges raw ratings with the globally cached profile list to prevent complex PostgREST join mapping.
 */
export async function getAllRatingsAdmin() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) return { error: 'Not authenticated.', data: [] }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_king')
        .eq('id', myId)
        .single()

    if (!profile?.is_king) {
        return { error: 'Unauthorized. Kings only.', data: [] }
    }

    // Fetch all ratings
    const { data: ratings, error: ratingsError } = await supabase
        .from('player_ratings')
        .select('*')

    if (ratingsError) {
        console.error('Error fetching all ratings for admin:', ratingsError.message)
        return { error: ratingsError.message, data: [] }
    }

    // Fetch all profiles to map manually and avoid ambiguous FK issues
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, player_position')

    if (profilesError) {
        console.error('Error fetching profiles mapping:', profilesError.message)
        return { error: profilesError.message, data: [] }
    }

    const profilesMap = new Map(profiles?.map(p => [p.id, p]))

    const stitchedRatings = (ratings || []).map(r => ({
        rater_id: r.rater_id,
        ratee_id: r.ratee_id,
        rating: r.rating,
        updated_at: r.updated_at,
        rater: profilesMap.get(r.rater_id) || null,
        ratee: profilesMap.get(r.ratee_id) || null
    }))

    return { success: true, data: stitchedRatings }
}

/**
 * Publish all ratings.
 * Averages ratings for each player and updates peer_rating_score.
 */
export async function publishRatings() {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const myId = userData?.user?.id

    if (!myId) {
        return { error: 'Not authenticated.' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', myId)
        .single()
        
    if (!profile?.is_admin) {
        return { error: 'Unauthorized. Only admins can publish ratings.' }
    }

    const { data: ratings, error } = await supabase
        .from('player_ratings')
        .select('ratee_id, rating')

    if (error) {
        return { error: error.message }
    }

    if (!ratings || ratings.length === 0) {
        return { error: 'No ratings found to publish.' }
    }

    const sums: Record<string, { sum: number, count: number }> = {}
    for (const r of ratings) {
        if (!sums[r.ratee_id]) {
            sums[r.ratee_id] = { sum: 0, count: 0 }
        }
        sums[r.ratee_id].sum += r.rating
        sums[r.ratee_id].count += 1
    }

    const updates = []
    for (const ratee_id in sums) {
        const avg = sums[ratee_id].sum / sums[ratee_id].count
        const roundedAvg = Math.round(avg * 100) / 100
        updates.push({ id: ratee_id, peer_rating_score: roundedAvg })
    }

    // Update each profile
    let updatedCount = 0
    for(const u of updates) {
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({ peer_rating_score: u.peer_rating_score })
            .eq('id', u.id)
            
        if (!updateErr) updatedCount++
    }

    revalidatePath('/ratings')
    revalidatePath('/players')
    revalidatePath('/dashboard')
    ;(revalidateTag as any)('leaderboard')
    
    return { success: true, count: updatedCount }
}

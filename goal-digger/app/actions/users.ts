'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Guard: throw if the current user is not an admin */
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_king) throw new Error('Only admins can manage users')
    return { supabase, userId: user.id }
}

/** Fetch every profile (admin only) */
export async function getUsers() {
    const { supabase, userId } = await requireAdmin()

    // Get current user's profile to check if they are King
    const { data: currentUser } = await supabase
        .from('profiles')
        .select('is_king, tenant_id')
        .eq('id', userId)
        .single()

    if (currentUser?.is_king) {
        // King bypasses tenant isolation for user management.
        // We use the service role client to fetch all profiles across all tenants.
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data, error } = await adminSupabase
            .from('profiles')
            .select('id, first_name, last_name, nickname, avatar_url, role, is_admin, is_king, is_manager, is_player, is_viewer, is_active, player_position, base_score, goals, matches_played, auction_budget, created_at, updated_at, tenant_id, tenant:tenants(name)')
            .order('created_at', { ascending: true })

        if (error) throw new Error(error.message)
        
        // Map and normalize tenant data (Supabase types join tables as arrays by default)
        return (data ?? []).map(u => {
            const tenantVal = u.tenant as unknown
            const tenantObj = Array.isArray(tenantVal)
                ? (tenantVal[0] as { name: string } | undefined)
                : (tenantVal as { name: string } | null | undefined)
            return {
                ...u,
                is_active: u.is_active ?? true,
                tenant: tenantObj ? { name: String(tenantObj.name) } : null
            }
        })
    } else {
        // Regular admin is restricted to their own tenant
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, nickname, avatar_url, role, is_admin, is_king, is_manager, is_player, is_viewer, is_active, player_position, base_score, goals, matches_played, auction_budget, created_at, updated_at, tenant_id, tenant:tenants(name)')
            .eq('tenant_id', currentUser?.tenant_id)
            .order('created_at', { ascending: true })

        if (error) throw new Error(error.message)
        
        // Map and normalize tenant data (Supabase types join tables as arrays by default)
        return (data ?? []).map(u => {
            const tenantVal = u.tenant as unknown
            const tenantObj = Array.isArray(tenantVal)
                ? (tenantVal[0] as { name: string } | undefined)
                : (tenantVal as { name: string } | null | undefined)
            return {
                ...u,
                is_active: u.is_active ?? true,
                tenant: tenantObj ? { name: String(tenantObj.name) } : null
            }
        })
    }
}

/** Update a user profile (admin only) */
export async function updateUser(
    id: string,
    data: {
        first_name?: string
        last_name?: string
        nickname?: string | null
        role?: string
        is_admin?: boolean
        is_manager?: boolean
        is_player?: boolean
        is_viewer?: boolean
        is_active?: boolean
        player_position?: string | null
        base_score?: number
        auction_budget?: number
        tenant_id?: string | null
    }
) {
    const { supabase, userId } = await requireAdmin()

    // Get current user's profile to check if they are King
    const { data: currentUser } = await supabase
        .from('profiles')
        .select('is_king, tenant_id')
        .eq('id', userId)
        .single()

    const isKing = currentUser?.is_king || false

    // If not King, verify the target user belongs to the same tenant
    if (!isKing) {
        const { data: targetUser } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', id)
            .single()

        if (!targetUser || targetUser.tenant_id !== currentUser?.tenant_id) {
            throw new Error('Not authorized to manage users in other groups')
        }
    }

    // Perform the update
    // If King, we use the admin client to bypass RLS for other tenants
    let client = supabase
    if (isKing) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        client = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    } else {
        delete data.tenant_id
    }

    const { error } = await client
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/users')
    revalidatePath('/players')
    revalidatePath('/dashboard')
}

/** Delete a user profile (admin only, cannot self-delete) */
export async function deleteUser(id: string) {
    const { supabase, userId } = await requireAdmin()

    if (id === userId) throw new Error('You cannot delete your own account')

    // Get current user's profile to check if they are King
    const { data: currentUser } = await supabase
        .from('profiles')
        .select('is_king, tenant_id')
        .eq('id', userId)
        .single()

    const isKing = currentUser?.is_king || false

    // If not King, verify the target user belongs to the same tenant
    if (!isKing) {
        const { data: targetUser } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', id)
            .single()

        if (!targetUser || targetUser.tenant_id !== currentUser?.tenant_id) {
            throw new Error('Not authorized to delete users in other groups')
        }
    }

    // Perform the deletion
    // If King, we use the admin client to bypass RLS for other tenants
    let client = supabase
    if (isKing) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        client = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }

    const { error } = await client
        .from('profiles')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/users')
    revalidatePath('/players')
    revalidatePath('/dashboard')
}


'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Fetch the tenant group details for the current user */
export async function getTenant() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, is_admin, is_king')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('Profile not found')

    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    if (error) throw new Error(error.message)

    return {
        id: tenant.id,
        name: tenant.name,
        isAdmin: profile.is_admin || profile.is_king
    }
}

/** Update the current user's tenant group name (Admin/King only) */
export async function updateTenantName(name: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, is_admin, is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    const { error } = await supabase
        .from('tenants')
        .update({ name })
        .eq('id', profile.tenant_id)

    if (error) throw new Error(error.message)

    revalidatePath('/settings/group')
}

/** Fetch all tenant groups (King only) */
export async function getAllGroups() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_king) throw new Error('Only the King can view all groups')

    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await adminSupabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

/** Create a new tenant group (King only) */
export async function createGroup(name: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_king) throw new Error('Only the King can create groups')

    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await adminSupabase
        .from('tenants')
        .insert({ name })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath('/settings/king')
    return data.id
}


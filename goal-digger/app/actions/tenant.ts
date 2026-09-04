'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

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
        etransferEmail: tenant.etransfer_email || 'mamnoon909@gmail.com',
        isAdmin: profile.is_admin || profile.is_king
    }
}

/** Update current tenant's active e-transfer email (Admin/King only) */
export async function updateTenantEtransferEmail(email: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, is_admin, is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Invalid email address')

    const { error } = await supabase
        .from('tenants')
        .update({ etransfer_email: cleanEmail })
        .eq('id', profile.tenant_id)

    if (error) throw new Error(error.message)

    ;(revalidateTag as any)('tenants')
    revalidatePath('/settings/advanced')
    revalidatePath('/settings/group')
}

/** Fetch list of e-transfer emails for the current tenant */
export async function getTenantEtransferEmails() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, is_admin, is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    // 1. Fetch custom e-transfer emails added for this tenant
    const { data: customEmails, error: customError } = await supabase
        .from('tenant_etransfer_emails')
        .select('id, email, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (customError && customError.code !== '42P01') {
        console.error('Error fetching tenant etransfer emails:', customError)
    }

    // 2. Fetch user emails belonging to this tenant
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname')
        .eq('tenant_id', profile.tenant_id)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    const userEmailsMap = new Map<string, string>()

    if (usersData?.users) {
        for (const u of usersData.users) {
            if (u.email && profileMap.has(u.id)) {
                const p = profileMap.get(u.id)!
                const name = p.nickname || `${p.first_name} ${p.last_name}`
                userEmailsMap.set(u.email.toLowerCase(), name)
            }
        }
    }

    const result: { id?: string; email: string; name?: string; isCustom: boolean }[] = []
    const seenEmails = new Set<string>()

    // Add custom emails
    for (const item of (customEmails || [])) {
        const clean = item.email.toLowerCase()
        if (!seenEmails.has(clean)) {
            seenEmails.add(clean)
            result.push({
                id: item.id,
                email: clean,
                name: userEmailsMap.get(clean) || 'Custom Email',
                isCustom: true
            })
        }
    }

    // Add registered user emails for this tenant
    for (const [email, name] of userEmailsMap.entries()) {
        if (!seenEmails.has(email)) {
            seenEmails.add(email)
            result.push({
                email,
                name,
                isCustom: false
            })
        }
    }

    // Always include fallback default if not present
    if (!seenEmails.has('mamnoon909@gmail.com')) {
        result.push({
            email: 'mamnoon909@gmail.com',
            name: 'Default Email',
            isCustom: false
        })
    }

    return result
}

/** Add a new custom e-transfer email for the current tenant */
export async function addTenantEtransferEmail(email: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, is_admin, is_king')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && !profile?.is_king) throw new Error('Not authorized')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Invalid email address')

    const { data, error } = await supabase
        .from('tenant_etransfer_emails')
        .insert({
            tenant_id: profile.tenant_id,
            email: cleanEmail,
            created_by: user.id
        })
        .select()
        .single()

    if (error && error.code !== '23505') {
        throw new Error(error.message)
    }

    revalidatePath('/settings/advanced')
    return data
}

/** Delete a custom e-transfer email for the current tenant */
export async function deleteTenantEtransferEmail(id: string) {
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
        .from('tenant_etransfer_emails')
        .delete()
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)

    if (error) throw new Error(error.message)

    revalidatePath('/settings/advanced')
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

    ;(revalidateTag as any)('tenants')
    revalidatePath('/settings/group')
}

const getCachedGroups = unstable_cache(
    async () => {
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
        return data ?? []
    },
    ['all-tenants-list'],
    { tags: ['tenants'], revalidate: 3600 }
)

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

    return getCachedGroups()
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

    ;(revalidateTag as any)('tenants')
    revalidatePath('/settings/king')
    return data.id
}


import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { getUsers } from '../../actions/users'
import { UserTable } from '../../../components/users/UserTable'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) redirect('/dashboard')

    const users = await getUsers()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
                <p className="mt-1 text-sm text-text-muted">
                    View, edit, and manage all user profiles and roles.
                </p>
            </div>

            <UserTable users={users} currentUserId={user.id} />
        </div>
    )
}

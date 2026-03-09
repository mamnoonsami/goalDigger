import { createClient } from '../../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateMatchForm } from '../../../../components/matches/CreateMatchForm'

export const dynamic = 'force-dynamic'

export default async function CreateMatchPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) redirect('/matches')

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Create Match</h1>
                <p className="mt-1 text-sm text-text-muted">Set up a new pickup match.</p>
            </div>

            <CreateMatchForm />
        </div>
    )
}

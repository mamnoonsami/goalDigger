import { createClient } from '../../../lib/supabase/server'
import { Card } from '../../../components/ui/Card'
import { Badge, roleVariant } from '../../../components/ui/Badge'
import { ProfileForm } from '../../../components/profile/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, player_position, base_score, goals, matches_played, created_at')
        .eq('id', user!.id)
        .single()

    if (!profile) {
        return (
            <Card>
                <p className="text-center text-sm text-text-muted py-10">
                    Profile not found. Please contact an administrator.
                </p>
            </Card>
        )
    }

    const effectiveScore = profile.base_score + profile.goals * 2

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
                <p className="mt-1 text-sm text-text-muted">Update your personal information and avatar.</p>
            </div>

            {/* Read-only stats row */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-accent font-mono">{effectiveScore}</span>
                    <span className="text-xs text-text-muted mt-1">Effective Score</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-text-primary font-mono">{profile.base_score}</span>
                    <span className="text-xs text-text-muted mt-1">Base Score</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-text-primary font-mono">{profile.goals}</span>
                    <span className="text-xs text-text-muted mt-1">Goals</span>
                </Card>
                <Card className="flex flex-col items-center text-center py-4">
                    <span className="text-2xl font-black text-text-primary font-mono">{profile.matches_played}</span>
                    <span className="text-xs text-text-muted mt-1">Matches</span>
                </Card>
            </div>

            {/* Editable profile form */}
            <Card>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-text-primary">Personal Information</h2>
                    <Badge variant={roleVariant[profile.role] ?? 'slate'}>
                        {profile.role}
                    </Badge>
                </div>
                <ProfileForm profile={profile} goals={profile.goals} />
            </Card>

            {/* Account info (read-only) */}
            <Card>
                <h2 className="font-semibold text-text-primary mb-3">Account</h2>
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-text-muted">Email</span>
                        <span className="text-text-primary">{user!.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-muted">Member since</span>
                        <span className="text-text-primary">
                            {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    )
}

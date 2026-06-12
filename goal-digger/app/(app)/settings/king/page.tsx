import { getAllGroups } from '../../../actions/tenant'
import { KingDashboardClient } from './KingDashboardClient'

export default async function KingPage() {
    const groups = await getAllGroups()

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-text-primary">👑 King Settings</h1>
                <p className="text-sm text-text-muted">Manage all tenant groups across the application.</p>
            </header>

            <KingDashboardClient initialGroups={groups} />
        </div>
    )
}

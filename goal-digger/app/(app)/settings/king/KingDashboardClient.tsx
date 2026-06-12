'use client'

import { useState } from 'react'
import { createGroup } from '../../../actions/tenant'
import { Card } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'

export function KingDashboardClient({ initialGroups }: { initialGroups: any[] }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [newGroupId, setNewGroupId] = useState<string | null>(null)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return
        
        setLoading(true)
        try {
            const id = await createGroup(name)
            setNewGroupId(id)
            setName('')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Create New Group</h2>
                </div>
                <div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Group Name</label>
                            <Input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Enter group name..." 
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" isLoading={loading}>Create Group</Button>
                    </form>

                    {newGroupId && (
                        <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                            <h3 className="text-success font-medium mb-2">Group Created Successfully!</h3>
                            <p className="text-sm text-text-muted mb-2">Share this Group ID with the new Admin:</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-surface-2 p-2 rounded text-sm font-mono">{newGroupId}</code>
                                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(newGroupId)}>Copy</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Existing Groups</h2>
                </div>
                <div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border text-text-muted">
                                    <th className="pb-2 font-medium">Group Name</th>
                                    <th className="pb-2 font-medium">Group ID (Tenant ID)</th>
                                    <th className="pb-2 font-medium">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {initialGroups.map(group => (
                                    <tr key={group.id} className="hover:bg-surface-2/50 transition-colors">
                                        <td className="py-3 font-medium text-text-primary">{group.name}</td>
                                        <td className="py-3 font-mono text-xs text-text-muted">{group.id}</td>
                                        <td className="py-3 text-text-muted">{new Date(group.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {initialGroups.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-text-muted">No groups found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { updateAuctionManagers } from '../../app/actions/auctions'

interface Manager {
    id: string
    first_name: string
    last_name: string
}

interface ManageAuctionManagersModalProps {
    auctionId: string
    allManagers: Manager[]
    initialAssignedIds: string[]
    onClose: () => void
}

export function ManageAuctionManagersModal({ auctionId, allManagers, initialAssignedIds, onClose }: ManageAuctionManagersModalProps) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [selectedManagers, setSelectedManagers] = useState<Set<string>>(new Set(initialAssignedIds))

    function toggleManager(managerId: string) {
        setSelectedManagers(prev => {
            const next = new Set(prev)
            if (next.has(managerId)) next.delete(managerId)
            else next.add(managerId)
            return next
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const initialSet = new Set(initialAssignedIds)
            const managersToAdd: string[] = []
            const managersToRemove: string[] = []

            for (const id of selectedManagers) {
                if (!initialSet.has(id)) managersToAdd.push(id)
            }
            for (const id of initialSet) {
                if (!selectedManagers.has(id)) managersToRemove.push(id)
            }

            await updateAuctionManagers(auctionId, managersToAdd, managersToRemove)
            router.refresh()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Manage Managers</h2>
                        <p className="text-xs text-text-muted">{selectedManagers.size} managers selected</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {allManagers.map(manager => {
                            const isSelected = selectedManagers.has(manager.id)
                            return (
                                <div
                                    key={manager.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer rounded border ${isSelected ? 'bg-accent/10 border-accent/30' : 'bg-surface-2 border-border hover:border-accent/30'}`}
                                    onClick={() => toggleManager(manager.id)}
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors flex-shrink-0 ${isSelected ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                                        {isSelected && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-text-primary truncate">{manager.first_name} {manager.last_name}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {error && <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-2 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="button" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Managers'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

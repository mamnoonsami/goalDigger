'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { updateUser } from '../../app/actions/users'
import type { UserRow } from './UserTable'

interface EditUserModalProps {
    user: UserRow
    onClose: () => void
}

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward']
const ROLES = ['admin', 'manager', 'player', 'viewer']

export function EditUserModal({ user, onClose }: EditUserModalProps) {
    const [firstName, setFirstName] = useState(user.first_name)
    const [lastName, setLastName] = useState(user.last_name)
    const [role, setRole] = useState(user.role)
    const [position, setPosition] = useState(user.player_position ?? '')
    const [baseScore, setBaseScore] = useState(user.base_score)
    const [auctionBudget, setAuctionBudget] = useState(user.auction_budget)
    const [isAdmin, setIsAdmin] = useState(user.is_admin)
    const [isManager, setIsManager] = useState(user.is_manager)
    const [isPlayer, setIsPlayer] = useState(user.is_player)
    const [isViewer, setIsViewer] = useState(user.is_viewer)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSave() {
        setSaving(true)
        setError('')
        try {
            await updateUser(user.id, {
                first_name: firstName,
                last_name: lastName,
                role,
                player_position: position || null,
                base_score: baseScore,
                auction_budget: auctionBudget,
                is_admin: isAdmin,
                is_manager: isManager,
                is_player: isPlayer,
                is_viewer: isViewer,
            })
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Edit User — {user.first_name} {user.last_name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-surface-3 hover:text-text-primary transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                    <div className="grid gap-4">
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-text-muted">First Name</span>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-text-muted">Last Name</span>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </label>
                        </div>

                        {/* Role + Position */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-text-muted">Role</span>
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                                >
                                    {ROLES.map(r => (
                                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-text-muted">Position</span>
                                <select
                                    value={position}
                                    onChange={e => setPosition(e.target.value)}
                                    className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                                >
                                    <option value="">None</option>
                                    {POSITIONS.map(p => (
                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {/* Numbers */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-text-muted">Base Score (1–100)</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={baseScore}
                                    onChange={e => setBaseScore(Number(e.target.value))}
                                    className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-text-muted">Auction Budget</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={auctionBudget}
                                    onChange={e => setAuctionBudget(Number(e.target.value))}
                                    className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </label>
                        </div>

                        {/* Boolean flags */}
                        <div>
                            <span className="text-xs font-medium text-text-muted mb-2 block">Permission Flags</span>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    ['Admin', isAdmin, setIsAdmin],
                                    ['Manager', isManager, setIsManager],
                                    ['Player', isPlayer, setIsPlayer],
                                    ['Viewer', isViewer, setIsViewer],
                                ] as const).map(([label, value, setter]) => (
                                    <label
                                        key={label}
                                        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-surface-3/50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={e => (setter as (v: boolean) => void)(e.target.checked)}
                                            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/50"
                                        />
                                        <span className="text-sm text-text-primary">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Read-only stats */}
                        <div className="rounded-lg bg-surface-1 border border-border p-3">
                            <span className="text-xs font-medium text-text-muted mb-2 block">Stats (read-only)</span>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-lg font-bold text-text-primary font-mono">{user.goals}</p>
                                    <p className="text-[11px] text-text-muted">Goals</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-text-primary font-mono">{user.matches_played}</p>
                                    <p className="text-[11px] text-text-muted">Matches</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-accent font-mono">{user.base_score + user.goals * 2}</p>
                                    <p className="text-[11px] text-text-muted">Eff. Score</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} isLoading={saving}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}

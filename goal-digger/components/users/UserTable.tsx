'use client'

import { useState, useMemo } from 'react'
import { Card } from '../ui/Card'
import { Badge, roleVariant } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { EditUserModal } from './EditUserModal'
import { deleteUser } from '../../app/actions/users'

export interface UserRow {
    id: string
    first_name: string
    last_name: string
    nickname?: string | null
    avatar_url: string | null
    role: string
    is_admin: boolean
    is_king: boolean
    is_manager: boolean
    is_player: boolean
    is_viewer: boolean
    player_position: string | null
    base_score: number
    goals: number
    matches_played: number
    auction_budget: number
    created_at: string
    updated_at: string
}

interface UserTableProps {
    users: UserRow[]
    currentUserId: string
}

type RoleFilter = 'all' | 'admin' | 'manager' | 'player' | 'viewer'
type PositionFilter = 'all' | 'goalkeeper' | 'defender' | 'midfielder' | 'striker'

export function UserTable({ users, currentUserId }: UserTableProps) {
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
    const [positionFilter, setPositionFilter] = useState<PositionFilter>('all')
    const [editUser, setEditUser] = useState<UserRow | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        return users.filter(u => {
            const name = `${u.first_name} ${u.last_name}`.toLowerCase()
            const matchesSearch = search === '' || name.includes(search.toLowerCase())
            const matchesRole = roleFilter === 'all'
                || (roleFilter === 'admin' && u.is_admin)
                || (roleFilter === 'manager' && u.is_manager)
                || (roleFilter === 'player' && u.is_player)
                || (roleFilter === 'viewer' && u.is_viewer)
            const matchesPosition = positionFilter === 'all' || u.player_position === positionFilter
            return matchesSearch && matchesRole && matchesPosition
        })
    }, [users, search, roleFilter, positionFilter])

    async function handleDelete(id: string) {
        setDeletingId(id)
        try {
            await deleteUser(id)
            setConfirmDeleteId(null)
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete user')
        } finally {
            setDeletingId(null)
        }
    }

    const flagBadge = (active: boolean, label: string) => (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${active
            ? 'bg-accent/15 text-accent'
            : 'bg-surface-3 text-text-muted/40'
            }`}>
            {label}
        </span>
    )

    return (
        <>
            {/* Filters */}
            <Card padding="sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-3 flex items-center text-text-muted pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name…"
                            className="w-full rounded-lg border border-border bg-surface-1 py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
                        {/* Role filter */}
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value as RoleFilter)}
                            className="flex-1 sm:flex-none min-w-[110px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="player">Player</option>
                            <option value="viewer">Viewer</option>
                        </select>

                        {/* Position filter */}
                        <select
                            value={positionFilter}
                            onChange={e => setPositionFilter(e.target.value as PositionFilter)}
                            className="flex-1 sm:flex-none min-w-[125px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                            <option value="all">All Positions</option>
                            <option value="goalkeeper">Goalkeeper</option>
                            <option value="defender">Defender</option>
                            <option value="midfielder">Midfielder</option>
                            <option value="striker">Striker</option>
                        </select>
                    </div>

                    {/* Count */}
                    <div className="flex items-center text-sm text-text-muted whitespace-nowrap">
                        {filtered.length} user{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </Card>

            {/* Desktop table */}
            <Card padding="none" className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                            <th className="px-5 py-3">User</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Flags</th>
                            <th className="px-5 py-3">Position</th>
                            <th className="px-5 py-3 text-right">Base Score</th>
                            <th className="px-5 py-3 text-right">Goals</th>
                            <th className="px-5 py-3 text-right">Matches</th>
                            <th className="px-5 py-3 text-right">Budget</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.map(u => (
                            <tr key={u.id} className="hover:bg-surface-3/50 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar firstName={u.first_name} lastName={u.last_name} avatarUrl={u.avatar_url} size="sm" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-text-primary truncate">
                                                {u.first_name} {u.last_name}
                                            </p>
                                            <p className="text-xs text-text-muted truncate">
                                                {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <Badge variant={roleVariant[u.role] ?? 'slate'}>{u.role}</Badge>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        {u.is_king && flagBadge(true, 'K')}
                                        {flagBadge(u.is_admin, 'A')}
                                        {flagBadge(u.is_manager, 'M')}
                                        {flagBadge(u.is_player, 'P')}
                                        {flagBadge(u.is_viewer, 'V')}
                                    </div>
                                </td>
                                <td className="px-5 py-3 capitalize text-text-muted">
                                    {u.player_position ?? '—'}
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-text-primary">{u.base_score}</td>
                                <td className="px-5 py-3 text-right font-mono text-text-primary">{u.goals}</td>
                                <td className="px-5 py-3 text-right font-mono text-text-primary">{u.matches_played}</td>
                                <td className="px-5 py-3 text-right font-mono text-text-primary">{u.auction_budget}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setEditUser(u)}>
                                            Edit
                                        </Button>
                                        {u.id !== currentUserId && (
                                            confirmDeleteId === u.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        isLoading={deletingId === u.id}
                                                        onClick={() => handleDelete(u.id)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                                                        ✕
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => setConfirmDeleteId(u.id)}>
                                                    Delete
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <p className="py-10 text-center text-sm text-text-muted">No users match your filters.</p>
                )}
            </Card>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
                {filtered.length === 0 && (
                    <Card>
                        <p className="py-10 text-center text-sm text-text-muted">No users match your filters.</p>
                    </Card>
                )}
                {filtered.map(u => (
                    <Card key={u.id} padding="sm" className="relative">
                        <div className="flex items-start gap-3 pr-8">
                            <Avatar firstName={u.first_name} lastName={u.last_name} avatarUrl={u.avatar_url} size="sm" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-text-primary truncate">
                                        {u.first_name} {u.last_name}
                                    </p>
                                    <Badge variant={roleVariant[u.role] ?? 'slate'}>{u.role}</Badge>
                                </div>
                                <p className="text-xs text-text-muted mt-0.5 capitalize">
                                    {u.player_position ?? 'No position'} · Score: {u.base_score} · {u.goals}G · {u.matches_played}M
                                </p>
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                    {u.is_king && flagBadge(true, 'K')}
                                    {flagBadge(u.is_admin, 'A')}
                                    {flagBadge(u.is_manager, 'M')}
                                    {flagBadge(u.is_player, 'P')}
                                    {flagBadge(u.is_viewer, 'V')}
                                </div>
                            </div>
                        </div>

                        {/* Top-right action menu */}
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => setActiveDropdownId(activeDropdownId === u.id ? null : u.id)}
                                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-3 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>

                            {/* Dropdown popup */}
                            {activeDropdownId === u.id && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                    <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-surface-2 p-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={() => {
                                                setEditUser(u)
                                                setActiveDropdownId(null)
                                            }}
                                            className="w-full flex items-center px-3 py-2 text-sm text-text-primary hover:bg-surface-3 rounded-md transition-colors"
                                        >
                                            Edit profile
                                        </button>
                                        
                                        {u.id !== currentUserId && (
                                            <div className="border-t border-border mt-1 pt-1">
                                                {confirmDeleteId === u.id ? (
                                                    <div className="flex flex-col gap-1 px-1">
                                                        <span className="text-xs text-center text-text-muted mb-1 mt-1">Sure?</span>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                fullWidth
                                                                className="h-7 text-xs px-2"
                                                                isLoading={deletingId === u.id}
                                                                onClick={() => handleDelete(u.id)}
                                                            >
                                                                Yes
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-7 px-2"
                                                                onClick={() => setConfirmDeleteId(null)}
                                                            >
                                                                ✕
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDeleteId(u.id);
                                                        }}
                                                        className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                                                    >
                                                        Delete profile
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Edit modal */}
            {editUser && (
                <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
            )}
        </>
    )
}

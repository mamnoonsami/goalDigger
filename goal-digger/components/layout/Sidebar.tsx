'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/Logo'
import { useChatStore } from '../../store/chatStore'

type SidebarIconName = 'dashboard' | 'chat' | 'matches' | 'players' | 'tournaments' | 'auctions' | 'profile' | 'ratings' | 'users' | 'settings' | 'king'

const navItems: { href: string; label: string; icon: SidebarIconName }[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/chat', label: 'Group Chat', icon: 'chat' },
    { href: '/matches', label: 'Matches', icon: 'matches' },
    { href: '/players', label: 'Players', icon: 'players' },
    { href: '/tournaments', label: 'Tournaments', icon: 'tournaments' },
    { href: '/auctions', label: 'Auctions', icon: 'auctions' },
    { href: '/profile', label: 'My Profile', icon: 'profile' },
]

function SidebarIcon({ name }: { name: SidebarIconName }) {
    const common = {
        className: 'h-[18px] w-[18px]',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    }

    switch (name) {
        case 'dashboard':
            return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        case 'chat':
            return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.2-.6L4 20l1.3-3.7A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeWidth="2.4" /></svg>
        case 'matches':
            return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2M12 10.4l3.7 2.7-1.4 4.2-4.3.1-2.1-3.9M14.6 7.2l4.1-.2M15.7 13.1l3.7 2.4" /></svg>
        case 'players':
            return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.4" /></svg>
        case 'tournaments':
            return <svg {...common}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4M12 13v4M8 20h8M9 17h6" /></svg>
        case 'auctions':
            return <svg {...common}><path d="m14 5 5 5M12.5 6.5l5 5M4 20l4.3-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="M13 20h7" /></svg>
        case 'profile':
            return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
        case 'ratings':
            return <svg {...common}><path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.5l6.2-.9L12 3Z" /></svg>
        case 'users':
            return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0-1-5.8M17 14.5a4 4 0 0 1 4 4V20" /></svg>
        case 'settings':
            return <svg {...common}><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3H3.3a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-1.3V2.3a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 2.1Z" /></svg>
        case 'king':
            return <svg {...common}><path d="m5 8 2.2 2.2L12 5l4.8 5.2L19 8l1 11H4L5 8Z" /><path d="M3 21h18M7 16h10" /></svg>
    }
}

interface SidebarProps {
    /** On mobile we render as a drawer — controlled by parent */
    open?: boolean
    onClose?: () => void
    isMinimized?: boolean
    onToggleMinimize?: () => void
    isAdmin?: boolean
    isKing?: boolean
    isPlayer?: boolean
    isManager?: boolean
}

export function Sidebar({ open = true, onClose, isMinimized = false, onToggleMinimize, isAdmin = false, isKing = false, isPlayer = false, isManager = false }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const unreadCount = useChatStore((s) => s.unreadCount)

    const isSettingsActive = pathname.startsWith('/settings')
    const [settingsOpen, setSettingsOpen] = useState(isSettingsActive)

    useEffect(() => {
        if (isSettingsActive) {
            setSettingsOpen(true)
        }
    }, [isSettingsActive])

    async function handleLogout() {
        const supabase = createBrowserSupabaseClient()
        await supabase.auth.signOut()
        if (onClose) onClose()
        router.push('/login')
        router.refresh()
    }

    // Build nav items — conditionally include admin-only and rating items
    const canRate = isAdmin || isPlayer || isManager
    
    const items = [
        ...navItems,
        ...(canRate ? [
            { href: '/ratings', label: 'Rate Your Teammates', icon: 'ratings' as SidebarIconName }
        ] : []),
        ...(isAdmin ? [
            { href: '/users', label: 'User Management', icon: 'users' as SidebarIconName },
        ] : []),
    ]

    const hasSettings = isAdmin || isKing

    return (
        <>
            {/* Mobile overlay backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                    aria-hidden
                />
            )}

            {/* Sidebar wrapper — relative so the floating toggle can anchor to it */}
            <div className="relative">
                {/* Spacer — reserves width for the fixed sidebar on desktop */}
                <div className={cn(
                    'hidden md:block shrink-0 transition-[width] duration-300 ease-in-out',
                    isMinimized ? 'w-[72px]' : 'w-[240px]'
                )} />
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-30 flex flex-col',
                    'border-r border-border bg-surface-2/95 shadow-[8px_0_30px_rgba(0,0,0,0.08)] backdrop-blur-xl',
                        'transition-[width,transform] duration-300 ease-in-out',
                        'h-screen',
                        isMinimized ? 'w-[72px]' : 'w-[240px]',
                        // Desktop: always visible
                        'md:translate-x-0',
                        // Mobile: visible only when open
                        open ? 'translate-x-0' : '-translate-x-full'
                    )}
                    aria-label="Main navigation"
                >
                    {/* Brand */}
                    <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-4">
                        <Link href="/dashboard" className={cn('flex min-w-0 items-center overflow-hidden transition-opacity hover:opacity-80', isMinimized && 'mx-auto')}>
                            {isMinimized ? (
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-xs font-bold tracking-tight text-white shadow-sm">GD</span>
                            ) : (
                                <Logo size="md" />
                            )}
                        </Link>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close menu"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary md:hidden"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                        </button>
                    </div>

                    {!isMinimized && (
                        <div className="px-5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                            Main menu
                        </div>
                    )}

                    {isMinimized && <div className="h-4" />}

                    {/* Nav */}
                    <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                        <ul className="flex flex-col gap-1">
                            {items.map(({ href, label, icon }) => {
                                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                                const isChat = href === '/chat'
                                const showBadge = isChat && unreadCount > 0 && !active
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            onClick={onClose}
                                            title={isMinimized ? label : undefined}
                                            className={cn(
                                                'group flex min-h-[44px] items-center rounded-xl py-2.5 transition-all duration-150',
                                                isMinimized ? 'justify-center px-0 mx-1' : 'gap-3 px-3',
                                                'text-sm font-medium',
                                                active
                                                    ? 'bg-accent/12 text-accent shadow-sm'
                                                    : 'text-text-muted hover:bg-surface-3/75 hover:text-text-primary'
                                            )}
                                        >
                                            <span className={cn('relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors', active ? 'bg-accent/15' : 'bg-transparent group-hover:bg-surface-3')}>
                                                <SidebarIcon name={icon} />
                                                {/* Unread notification dot (minimized) */}
                                                {showBadge && isMinimized && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-surface-2">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}
                                            </span>
                                            {!isMinimized && (
                                                <span className="flex flex-1 items-center justify-between whitespace-nowrap overflow-hidden">
                                                    {label}
                                                    {/* Unread badge (expanded) */}
                                                    {showBadge && (
                                                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                                            {unreadCount > 99 ? '99+' : unreadCount}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                )
                            })}

                            {/* Parent Settings Menu */}
                            {hasSettings && (
                                <li key="settings-parent" className="flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => setSettingsOpen(!settingsOpen)}
                                        title={isMinimized ? 'Settings' : undefined}
                                        className={cn(
                                            'group flex min-h-[44px] w-full items-center rounded-xl py-2.5 transition-all duration-150',
                                            isMinimized ? 'justify-center px-0 mx-1' : 'gap-3 px-3',
                                            'text-sm font-medium',
                                            isSettingsActive
                                                ? 'bg-accent/12 text-accent shadow-sm'
                                                : 'text-text-muted hover:bg-surface-3/75 hover:text-text-primary'
                                        )}
                                    >
                                        <span className={cn('relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors', isSettingsActive ? 'bg-accent/15' : 'bg-transparent group-hover:bg-surface-3')}>
                                            <SidebarIcon name="settings" />
                                        </span>
                                        {!isMinimized && (
                                            <span className="flex flex-1 items-center justify-between whitespace-nowrap overflow-hidden">
                                                <span>Settings</span>
                                                <svg
                                                    className={cn('h-4 w-4 transition-transform duration-200', settingsOpen && 'rotate-180')}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>

                                    {/* Settings Sub-items */}
                                    {settingsOpen && (
                                        <ul className={cn('flex flex-col gap-1 mt-1', !isMinimized && 'pl-4 border-l border-border/60 ml-6')}>
                                            {isAdmin && (
                                                <li>
                                                    <Link
                                                        href="/settings/group"
                                                        onClick={onClose}
                                                        title={isMinimized ? 'Group Settings' : undefined}
                                                        className={cn(
                                                            'flex min-h-[38px] items-center rounded-lg py-2 text-xs font-medium transition-colors',
                                                            isMinimized ? 'justify-center px-0 mx-1' : 'gap-2 px-3',
                                                            pathname === '/settings/group'
                                                                ? 'bg-accent/15 text-accent font-semibold'
                                                                : 'text-text-muted hover:bg-surface-3/75 hover:text-text-primary'
                                                        )}
                                                    >
                                                        {!isMinimized ? (
                                                            <span>Group Settings</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold">GRP</span>
                                                        )}
                                                    </Link>
                                                </li>
                                            )}
                                            {isKing && (
                                                <li>
                                                    <Link
                                                        href="/settings/king"
                                                        onClick={onClose}
                                                        title={isMinimized ? 'King Settings' : undefined}
                                                        className={cn(
                                                            'flex min-h-[38px] items-center rounded-lg py-2 text-xs font-medium transition-colors',
                                                            isMinimized ? 'justify-center px-0 mx-1' : 'gap-2 px-3',
                                                            pathname === '/settings/king'
                                                                ? 'bg-accent/15 text-accent font-semibold'
                                                                : 'text-text-muted hover:bg-surface-3/75 hover:text-text-primary'
                                                        )}
                                                    >
                                                        {!isMinimized ? (
                                                            <span>King Settings</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold">KNG</span>
                                                        )}
                                                    </Link>
                                                </li>
                                            )}
                                            {isAdmin && (
                                                <li>
                                                    <Link
                                                        href="/settings/advanced"
                                                        onClick={onClose}
                                                        title={isMinimized ? 'Advanced Settings' : undefined}
                                                        className={cn(
                                                            'flex min-h-[38px] items-center rounded-lg py-2 text-xs font-medium transition-colors',
                                                            isMinimized ? 'justify-center px-0 mx-1' : 'gap-2 px-3',
                                                            pathname === '/settings/advanced'
                                                                ? 'bg-accent/15 text-accent font-semibold'
                                                                : 'text-text-muted hover:bg-surface-3/75 hover:text-text-primary'
                                                        )}
                                                    >
                                                        {!isMinimized ? (
                                                            <span>Advanced Settings</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold">ADV</span>
                                                        )}
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </li>
                            )}
                        </ul>
                    </nav>

                    {/* Footer / Mobile Actions */}
                    <div className="border-t border-border flex flex-col p-3 shrink-0 overflow-hidden">
                        {/* Mobile Logout Button */}
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors md:hidden w-full text-left"
                            )}
                        >
                            <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Sign out</span>
                        </button>

                        {!isMinimized && (
                            <p className="text-xs text-text-muted whitespace-nowrap pl-2 mt-2 md:mt-0">v0.1</p>
                        )}
                    </div>
                </aside>

                {/* Floating minimize/maximize toggle — vertically centered on the sidebar edge */}
                <button
                    onClick={onToggleMinimize}
                    className={cn(
                        "hidden md:flex fixed z-40 items-center justify-center",
                        "h-7 w-7 rounded-full",
                        "border border-border bg-surface-2 text-text-muted",
                        "hover:text-text-primary hover:bg-surface-3",
                        "shadow-sm transition-all duration-300 ease-in-out",
                        "top-1/2 -translate-y-1/2",
                        isMinimized ? 'left-[72px] -translate-x-1/2' : 'left-[240px] -translate-x-1/2'
                    )}
                    title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
                >
                    {isMinimized ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    )}
                </button>
            </div>
        </>
    )
}

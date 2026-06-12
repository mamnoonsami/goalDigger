'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/Logo'
import { useChatStore } from '../../store/chatStore'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/chat', label: 'Group Chat', icon: '💬' },
    { href: '/matches', label: 'Matches', icon: '⚽' },
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/tournaments', label: 'Tournaments', icon: '🏆' },
    { href: '/auctions', label: 'Auctions', icon: '🔨' },
    { href: '/profile', label: 'My Profile', icon: '👤' },
]

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
            { href: '/ratings', label: 'Rate Your Teammates', icon: '⭐' }
        ] : []),
        ...(isAdmin ? [
            { href: '/users', label: 'User Management', icon: '🛡️' },
            { href: '/settings/group', label: 'Group Settings', icon: '⚙️' }
        ] : []),
        ...(isKing ? [
            { href: '/settings/king', label: 'King Settings', icon: '👑' }
        ] : []),
    ]

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
                        'bg-surface-2 border-r border-border',
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
                    <Link href="/dashboard" className="flex h-16 shrink-0 items-center justify-center border-b border-border overflow-hidden transition-all duration-300 hover:bg-surface-3/50 px-4">
                        {!isMinimized && <Logo size="md" />}
                    </Link>

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
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
                                                'flex items-center rounded-lg py-2.5 transition-colors duration-150 min-h-[44px]',
                                                isMinimized ? 'justify-center px-0 mx-1' : 'gap-3 px-3',
                                                'text-sm font-medium',
                                                active
                                                    ? 'bg-accent/15 text-accent'
                                                    : 'text-text-muted hover:bg-surface-3 hover:text-text-primary'
                                            )}
                                        >
                                            <span className="relative flex-shrink-0 text-base leading-none flex items-center justify-center">
                                                {icon}
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

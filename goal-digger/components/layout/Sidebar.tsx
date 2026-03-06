'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/Logo'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
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
}

export function Sidebar({ open = true, onClose, isMinimized = false, onToggleMinimize, isAdmin = false }: SidebarProps) {
    const pathname = usePathname()

    // Build nav items — conditionally include admin-only items
    const items = [
        ...navItems,
        ...(isAdmin ? [{ href: '/users', label: 'User Management', icon: '🛡️' }] : []),
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
                        <Logo size={isMinimized ? 'sm' : 'md'} />
                    </Link>

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
                        <ul className="flex flex-col gap-1">
                            {items.map(({ href, label, icon }) => {
                                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
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
                                            <span className="flex-shrink-0 text-base leading-none flex items-center justify-center">{icon}</span>
                                            {!isMinimized && (
                                                <span className="whitespace-nowrap overflow-hidden">{label}</span>
                                            )}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-border flex items-center p-3 min-h-[48px] shrink-0 overflow-hidden">
                        {!isMinimized && (
                            <p className="text-xs text-text-muted whitespace-nowrap pl-2">v0.1</p>
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

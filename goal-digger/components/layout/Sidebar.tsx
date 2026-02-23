'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'

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
}

export function Sidebar({ open = true, onClose, isMinimized = false, onToggleMinimize }: SidebarProps) {
    const pathname = usePathname()

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

            {/* Sidebar panel */}
            <aside
                className={cn(
                    // Mobile: slide-in drawer from left
                    'fixed inset-y-0 left-0 z-30 flex flex-col',
                    'bg-surface-2 border-r border-border',
                    'transition-[width,transform] duration-300 ease-in-out',
                    isMinimized ? 'w-[72px]' : 'w-[240px]',
                    // Desktop: always visible
                    'md:translate-x-0 md:static md:z-auto',
                    // Mobile: visible only when open
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
                aria-label="Main navigation"
            >
                {/* Brand */}
                <div className={cn("flex h-16 items-center border-b border-border overflow-hidden transition-all duration-300", isMinimized ? "px-0 justify-center" : "gap-2.5 px-5")}>
                    <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm shadow-md shadow-accent/30">
                        ⚽
                    </span>
                    {!isMinimized && (
                        <span className="text-base font-bold text-text-primary tracking-tight whitespace-nowrap overflow-hidden">Goal Digger</span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="flex flex-col gap-1">
                        {navItems.map(({ href, label, icon }) => {
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

                {/* Footer & Toggle */}
                <div className="border-t border-border flex items-center justify-between p-3 min-h-[56px] overflow-hidden">
                    {!isMinimized && (
                        <p className="text-xs text-text-muted whitespace-nowrap pl-2">v0.1</p>
                    )}

                    {/* Desktop Minimizer Toggle */}
                    <button
                        onClick={onToggleMinimize}
                        className={cn(
                            "hidden md:flex items-center justify-center h-8 w-8 rounded text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors",
                            isMinimized && "mx-auto"
                        )}
                        title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
                    >
                        {isMinimized ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                        )}
                    </button>
                </div>
            </aside>
        </>
    )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/matches', label: 'Matches', icon: '⚽' },
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/tournaments', label: 'Tournaments', icon: '🏆' },
    { href: '/profile', label: 'My Profile', icon: '👤' },
]

interface SidebarProps {
    /** On mobile we render as a drawer — controlled by parent */
    open?: boolean
    onClose?: () => void
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
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
                    'w-[var(--sidebar-w)] bg-surface-2 border-r border-border',
                    'transition-transform duration-300 ease-in-out',
                    // Desktop: always visible
                    'md:translate-x-0 md:static md:z-auto',
                    // Mobile: visible only when open
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
                aria-label="Main navigation"
            >
                {/* Brand */}
                <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm shadow-md shadow-accent/30">
                        ⚽
                    </span>
                    <span className="text-base font-bold text-text-primary tracking-tight">Goal Digger</span>
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
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2.5',
                                            'text-sm font-medium transition-colors duration-150',
                                            'min-h-[44px]',
                                            active
                                                ? 'bg-accent/15 text-accent'
                                                : 'text-text-muted hover:bg-surface-3 hover:text-text-primary'
                                        )}
                                    >
                                        <span className="text-base leading-none">{icon}</span>
                                        {label}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="border-t border-border px-5 py-4">
                    <p className="text-xs text-text-muted">Goal Digger v0.1</p>
                </div>
            </aside>
        </>
    )
}

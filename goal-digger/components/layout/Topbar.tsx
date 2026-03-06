'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Avatar } from '../ui/Avatar'
import { Logo } from '../ui/Logo'
import type { Profile } from '@goaldigger/core'

import { cn } from '../../lib/utils'
import { useState, useRef, useEffect } from 'react'

interface TopbarProps {
    profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null
    onMenuClick: () => void
    isSidebarMinimized?: boolean
}

export function Topbar({ profile, onMenuClick, isSidebarMinimized = false }: TopbarProps) {
    const router = useRouter()
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    async function handleLogout() {
        const supabase = createBrowserSupabaseClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface-2/80 px-4 backdrop-blur-sm md:px-6">
            {/* Hamburger — mobile only */}
            <button
                onClick={onMenuClick}
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-3 text-text-muted hover:text-text-primary transition-colors md:hidden"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Mobile brand — centered */}
            <Link
                href="/dashboard"
                className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center",
                    isSidebarMinimized ? "flex" : "flex md:hidden"
                )}
            >
                <Logo size="sm" />
            </Link>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right controls */}
            <div className="flex items-center gap-2">
                <ThemeToggle />

                {profile && (
                    <div className="relative hidden md:block" ref={menuRef}>
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-3 px-3 py-1.5 cursor-pointer hover:bg-surface-3/80 transition-colors"
                        >
                            <Avatar
                                firstName={profile.first_name}
                                lastName={profile.last_name}
                                avatarUrl={profile.avatar_url}
                                size="sm"
                            />
                            <span className="hidden text-sm font-medium text-text-primary sm:block">
                                {profile.first_name}
                            </span>
                            <svg className="hidden sm:block text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-surface-2 p-1 shadow-lg py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-3 py-2 border-b border-border/50 mb-1 sm:hidden">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {profile.first_name} {profile.last_name}
                                    </p>
                                </div>
                                <Link
                                    href="/profile"
                                    onClick={() => setProfileMenuOpen(false)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-primary hover:bg-surface-3 transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    My Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}

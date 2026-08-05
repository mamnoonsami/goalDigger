'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Avatar } from '../ui/Avatar'
import { Logo } from '../ui/Logo'
import { useChatStore } from '../../store/chatStore'
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
    const unreadCount = useChatStore((s) => s.unreadCount)

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
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-surface-1/80 px-4 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-xl md:px-6">
            {/* Hamburger — mobile only */}
            {profile && (
                <button
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-text-muted shadow-sm transition-colors hover:border-accent/40 hover:text-accent md:hidden"
                >
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                </button>
            )}

            {/* Mobile brand — centered */}
            <Link
                href="/dashboard"
                className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center rounded-lg",
                    isSidebarMinimized ? "flex" : "flex md:hidden"
                )}
                >
                <Logo size="sm" />
            </Link>

            {/* Desktop context */}
            {profile && (
                <div className="hidden items-center gap-3 md:flex">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                        <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19V5M4 19h16M8 15v-3M12 15V8M16 15v-6M20 15v-2" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold tracking-tight text-text-primary">Team workspace</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            Everything is up to date
                        </p>
                    </div>
                </div>
            )}

            {!profile && <div className="hidden flex-1 md:block" />}
            {profile && <div className="flex-1" />}

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
                {profile && (
                    <Link
                        href="/chat"
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-text-muted shadow-sm transition-colors hover:border-accent/40 hover:text-accent"
                        title="Group Chat"
                    >
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 15.5a2 2 0 0 1-2 2H8l-4 3v-13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8Z" />
                            <path d="M8 10h8M8 13h5" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--color-surface-2)]">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                )}

                <ThemeToggle />

                {!profile && (
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/login" className="text-sm font-medium text-text-primary transition-colors hover:text-accent">Sign in</Link>
                        <Link href="/signup" className="hidden rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover sm:inline-flex">Sign up</Link>
                    </div>
                )}

                {profile && (
                    <div className="relative hidden md:block" ref={menuRef}>
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 shadow-sm transition-colors hover:border-accent/40 hover:bg-surface-3"
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
                            <div className="absolute right-0 top-full mt-3 w-52 rounded-xl border border-border bg-surface-2 p-1.5 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="mb-1 border-b border-border/50 px-3 py-2 sm:hidden">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {profile.first_name} {profile.last_name}
                                    </p>
                                </div>
                                <Link
                                    href="/profile"
                                    onClick={() => setProfileMenuOpen(false)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-3"
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
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
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

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Avatar } from '../ui/Avatar'
import type { Profile } from '@goaldigger/core'

interface TopbarProps {
    profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null
    onMenuClick: () => void
}

export function Topbar({ profile, onMenuClick }: TopbarProps) {
    const router = useRouter()

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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right controls */}
            <div className="flex items-center gap-2">
                <ThemeToggle />

                {profile && (
                    <Link href="/profile" className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-3 px-3 py-1.5 cursor-pointer hover:bg-surface-3/80 transition-colors">
                        <Avatar
                            firstName={profile.first_name}
                            lastName={profile.last_name}
                            avatarUrl={profile.avatar_url}
                            size="sm"
                        />
                        <span className="hidden text-sm font-medium text-text-primary sm:block">
                            {profile.first_name}
                        </span>
                    </Link>
                )}

                <button
                    onClick={handleLogout}
                    aria-label="Sign out"
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-3 px-3 text-sm text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="hidden sm:block">Sign out</span>
                </button>
            </div>
        </header>
    )
}

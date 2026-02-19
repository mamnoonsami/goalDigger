'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from '../../components/layout/Sidebar'
import { Topbar } from '../../components/layout/Topbar'
import type { Profile } from '@goaldigger/core'

interface AppShellProps {
    children: ReactNode
    profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null
}

export function AppShell({ children, profile }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-surface-1">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div className="flex flex-1 flex-col md:ml-[var(--sidebar-w)]">
                <Topbar profile={profile} onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

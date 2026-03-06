'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from '../../components/layout/Sidebar'
import { Topbar } from '../../components/layout/Topbar'
import { SessionTimeoutProvider } from '../providers/SessionTimeoutProvider'
import { ToastProvider } from '../providers/ToastProvider'
import type { Profile } from '@goaldigger/core'

interface AppShellProps {
    children: ReactNode
    profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null
    isAdmin?: boolean
}

export function AppShell({ children, profile, isAdmin = false }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)

    return (
        <ToastProvider>
            <SessionTimeoutProvider>
                <div className="flex min-h-screen bg-surface-1">
                    <Sidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        isMinimized={isSidebarMinimized}
                        onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
                        isAdmin={isAdmin}
                    />

                    {/* Main content area */}
                    <div className="flex flex-1 flex-col min-w-0">
                        <Topbar profile={profile} onMenuClick={() => setSidebarOpen(true)} />
                        <main className="flex-1 overflow-x-hidden p-3 md:p-4 lg:p-6">
                            {children}
                        </main>
                        <footer className="border-t border-border px-6 py-4">
                            <p className="text-xs text-text-muted">© 2026 Goal Digger</p>
                        </footer>
                    </div>
                </div>
            </SessionTimeoutProvider>
        </ToastProvider>
    )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '../ui/Card'
import { Badge, statusVariant } from '../ui/Badge'
import { LocalTime } from '../ui/LocalTime'

export interface MatchItem {
    id: string
    title: string
    status: string
    scheduled_at: string
    location: string | null
    max_players: number
    created_at: string
}

interface MatchesTabsProps {
    matches: MatchItem[]
    isAdmin: boolean
}

type TabType = 'all' | 'open' | 'completed' | 'other'

const STATUS_GRADIENTS: Record<string, string> = {
    open: 'from-emerald-500 to-emerald-500/20',
    balanced: 'from-slate-500/40 to-slate-500/10',
    in_progress: 'from-slate-500/40 to-slate-500/10',
    completed: 'from-slate-500/40 to-slate-500/10',
    cancelled: 'from-slate-500/40 to-slate-500/10',
}

const STATUS_ICON_STYLES: Record<string, string> = {
    open: 'bg-emerald-500/10 text-emerald-500',
    balanced: 'bg-surface-3 text-text-muted',
    in_progress: 'bg-surface-3 text-text-muted',
    completed: 'bg-surface-3 text-text-muted',
    cancelled: 'bg-surface-3 text-text-muted',
}

export function MatchesTabs({ matches, isAdmin }: MatchesTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('open')
    const [searchQuery, setSearchQuery] = useState('')

    const counts = useMemo(() => {
        let open = 0
        let completed = 0
        let other = 0

        for (const m of matches) {
            if (m.status === 'open') open++
            else if (m.status === 'completed') completed++
            else other++
        }

        return {
            all: matches.length,
            open,
            completed,
            other
        }
    }, [matches])

    const filteredMatches = useMemo(() => {
        return matches.filter((m) => {
            // Filter by status tab
            if (activeTab === 'open' && m.status !== 'open') return false
            if (activeTab === 'completed' && m.status !== 'completed') return false
            if (activeTab === 'other' && (m.status === 'open' || m.status === 'completed')) return false

            // Filter by search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const titleMatch = m.title.toLowerCase().includes(q)
                const locationMatch = (m.location || '').toLowerCase().includes(q)
                const statusMatch = m.status.toLowerCase().includes(q)
                return titleMatch || locationMatch || statusMatch
            }

            return true
        })
    }, [matches, activeTab, searchQuery])

    const TABS: { id: TabType; label: string; count: number }[] = [
        { id: 'all', label: 'All Matches', count: counts.all },
        { id: 'open', label: 'Open', count: counts.open },
        { id: 'completed', label: 'Completed', count: counts.completed },
        { id: 'other', label: 'Other', count: counts.other },
    ]

    return (
        <div className="flex min-w-0 flex-col gap-6 overflow-hidden lg:gap-8">
            {/* Header section */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Match centre</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">Find your next game.</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">Browse the schedule, choose your next fixture, and keep your squad moving.</p>
                </div>
                {isAdmin && (
                    <>
                        <Link
                            href="/matches/create"
                            className="hidden shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] sm:inline-flex"
                        >
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                            Create match
                        </Link>
                        <Link
                            href="/matches/create"
                            aria-label="Create match"
                            className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition-all hover:scale-105 hover:bg-accent-hover active:scale-[0.98] sm:hidden"
                        >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </Link>
                    </>
                )}
            </div>

            {/* Metric stat cards (Interactive) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`text-left rounded-xl border p-4 transition-all ${
                        activeTab === 'all'
                            ? 'border-accent bg-accent/10 shadow-sm'
                            : 'border-border bg-surface-2 hover:border-accent/30'
                    }`}
                >
                    <p className="text-xs font-medium text-text-muted">Total Matches</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{counts.all}</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('open')}
                    className={`text-left rounded-xl border p-4 transition-all ${
                        activeTab === 'open'
                            ? 'border-emerald-500 bg-emerald-500/15 shadow-sm'
                            : 'border-emerald-500/20 bg-emerald-500/[0.08] hover:border-emerald-500/40'
                    }`}
                >
                    <p className="text-xs font-medium text-emerald-400 font-semibold">Open Sign-ups</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-400">{counts.open}</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('completed')}
                    className={`text-left rounded-xl border p-4 transition-all ${
                        activeTab === 'completed'
                            ? 'border-border bg-surface-3 shadow-sm ring-1 ring-border'
                            : 'border-border bg-surface-2 hover:border-border/80'
                    }`}
                >
                    <p className="text-xs font-medium text-text-muted">Completed</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{counts.completed}</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('other')}
                    className={`text-left rounded-xl border p-4 transition-all ${
                        activeTab === 'other'
                            ? 'border-border bg-surface-3 shadow-sm ring-1 ring-border'
                            : 'border-border bg-surface-2 hover:border-border/80'
                    }`}
                >
                    <p className="text-xs font-medium text-text-muted">Other Statuses</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{counts.other}</p>
                </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Status Tabs */}
                <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto sm:gap-2" role="tablist" aria-label="Filter matches by status">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm lg:px-4 ${
                                    isActive
                                        ? 'border-accent bg-accent text-white shadow-sm shadow-accent/20'
                                        : 'border-border bg-surface-2 text-text-muted hover:border-accent/30 hover:text-text-primary'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    isActive ? 'bg-white/25 text-white' : 'bg-surface-3 text-text-muted'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Search Input */}
                <div className="relative min-w-0 w-full sm:w-64">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search matches..."
                        className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-4 text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                    />
                    <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Matches Grid */}
            {filteredMatches.length > 0 ? (
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredMatches.map((m) => {
                        const gradientClass = STATUS_GRADIENTS[m.status] || 'from-slate-500 to-slate-500/20'
                        const iconClass = STATUS_ICON_STYLES[m.status] || 'bg-slate-500/10 text-slate-400'

                        return (
                            <Link key={m.id} href={`/matches/${m.id}`} className="group min-w-0">
                                <Card hoverable className="relative h-full min-w-0 overflow-hidden p-0">
                                    <div className={`h-1 bg-gradient-to-r ${gradientClass}`} />
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Fixture</p>
                                                <h2 className="mt-2 truncate font-semibold tracking-tight text-text-primary transition-colors group-hover:text-accent">{m.title}</h2>
                                            </div>
                                            <Badge variant={statusVariant[m.status] ?? 'slate'}>{m.status}</Badge>
                                        </div>

                                        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 bg-surface-1/50 p-3">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2M12 10.4l3.7 2.7-1.4 4.2-4.3.1-2.1-3.9" /></svg>
                                            </div>
                                            <div className="min-w-0 text-sm">
                                                <p className="truncate font-medium text-text-primary"><LocalTime isoString={m.scheduled_at} format="long" /></p>
                                                <p className="mt-0.5 truncate text-xs text-text-muted">{m.location ?? 'Location TBD'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between text-xs text-text-muted">
                                            <span className="flex items-center gap-1.5"><svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0-1-5.8M17 14a4.5 4.5 0 0 1 3.5 4.4" /></svg> Up to {m.max_players} players</span>
                                            <span className="font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">View details →</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <Card className="border-dashed">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.6 3.7-2.6 3.2-4.3-.7L5.5 6.2" /></svg>
                        </div>
                        <p className="mt-4 font-medium text-text-primary">No matches found</p>
                        <p className="mt-1 text-sm text-text-muted">
                            {searchQuery ? 'Try clearing your search query.' : `There are no matches under the "${TABS.find(t => t.id === activeTab)?.label}" tab.`}
                        </p>
                    </div>
                </Card>
            )}
        </div>
    )
}

'use client'

import { useState, useMemo } from 'react'
import { Card } from '../../../../components/ui/Card'
import { Avatar } from '../../../../components/ui/Avatar'
import { Badge } from '../../../../components/ui/Badge'

interface ProfileMap {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    player_position?: string
}

interface RawRating {
    rater_id: string
    ratee_id: string
    rating: number
    updated_at: string
    rater: ProfileMap | null
    ratee: ProfileMap | null
}

interface AnalyticsClientProps {
    rawRatings: RawRating[]
}

export default function AnalyticsClient({ rawRatings }: AnalyticsClientProps) {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'raters'>('leaderboard')
    const [expandedRaterId, setExpandedRaterId] = useState<string | null>(null)

    // Leaderboard logic
    const leaderboard = useMemo(() => {
        const rateeMap = new Map<string, { profile: ProfileMap, totalScore: number, count: number }>()

        rawRatings.forEach(r => {
            if (!r.ratee) return
            if (!rateeMap.has(r.ratee_id)) {
                rateeMap.set(r.ratee_id, { profile: r.ratee, totalScore: 0, count: 0 })
            }
            const data = rateeMap.get(r.ratee_id)!
            data.totalScore += r.rating
            data.count += 1
        })

        return Array.from(rateeMap.values())
            .map(item => ({
                ...item,
                average: +(item.totalScore / item.count).toFixed(2)
            }))
            .sort((a, b) => b.average - a.average)
    }, [rawRatings])

    // Raters breakdowns
    const ratersList = useMemo(() => {
        const raterMap = new Map<string, { profile: ProfileMap, ratingsMade: RawRating[], averageGiven: number }>()

        rawRatings.forEach(r => {
            if (!r.rater) return
            if (!raterMap.has(r.rater_id)) {
                raterMap.set(r.rater_id, { profile: r.rater, ratingsMade: [], averageGiven: 0 })
            }
            const data = raterMap.get(r.rater_id)!
            data.ratingsMade.push(r)
        })

        return Array.from(raterMap.values())
            .map(item => {
                const totalGiven = item.ratingsMade.reduce((acc, curr) => acc + curr.rating, 0)
                item.averageGiven = +(item.ratingsMade.length > 0 ? totalGiven / item.ratingsMade.length : 0).toFixed(2)
                return item
            })
            .sort((a, b) => {
                if (b.ratingsMade.length !== a.ratingsMade.length) {
                    return b.ratingsMade.length - a.ratingsMade.length
                }
                return a.profile.first_name.localeCompare(b.profile.first_name)
            })
    }, [rawRatings])

    return (
        <div className="flex flex-col gap-6">
            {/* Standard Dashboard Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="!p-4 bg-gradient-to-br from-surface-2 to-surface-1 border-border/50">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Total Ratings</p>
                    <p className="text-2xl font-black text-text-primary mt-1">{rawRatings.length}</p>
                </Card>
                <Card className="!p-4 bg-gradient-to-br from-surface-2 to-surface-1 border-border/50">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Active Raters</p>
                    <p className="text-2xl font-black text-text-primary mt-1">{ratersList.length}</p>
                </Card>
                <Card className="!p-4 bg-gradient-to-br from-surface-2 to-surface-1 border-border/50">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Players Rated</p>
                    <p className="text-2xl font-black text-text-primary mt-1">{leaderboard.length}</p>
                </Card>
                <Card className="!p-4 bg-gradient-to-br from-surface-2 to-surface-1 border-border/50">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Global Average</p>
                    <p className="text-2xl font-black text-accent mt-1">
                        {rawRatings.length ? +(rawRatings.reduce((acc, curr) => acc + curr.rating, 0) / rawRatings.length).toFixed(2) : 0}
                    </p>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-border pb-px">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${activeTab === 'leaderboard' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    Average Leaderboard
                </button>
                <button
                    onClick={() => setActiveTab('raters')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors cursor-pointer border-b-2 ${activeTab === 'raters' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                    Raters Breakdown
                </button>
            </div>

            {/* Tab Content */}
            <div className="pb-10">
                {activeTab === 'leaderboard' && (
                    <div className="flex flex-col gap-3">
                        {leaderboard.length === 0 ? (
                            <p className="text-sm text-text-muted p-6 text-center border border-dashed border-border rounded-xl">No players have been rated yet.</p>
                        ) : (
                            leaderboard.map((item, index) => (
                                <Card key={item.profile.id} className="flex items-center justify-between !p-4 group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                            <span className="text-lg font-bold text-text-muted/50 group-hover:text-accent/50 transition-colors">
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <Avatar
                                            firstName={item.profile.first_name}
                                            lastName={item.profile.last_name}
                                            avatarUrl={item.profile.avatar_url}
                                            size="md"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-semibold text-text-primary truncate">
                                                {item.profile.first_name} {item.profile.last_name}
                                            </p>
                                            <p className="text-xs text-text-muted capitalize">
                                                {item.profile.player_position || 'Unknown Position'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 pl-4 border-l border-border gap-0.5">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-mono font-black text-accent">{item.average}</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wide">
                                            Based on {item.count} rating{item.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'raters' && (
                    <div className="flex flex-col gap-4">
                        {ratersList.length === 0 ? (
                            <p className="text-sm text-text-muted p-6 text-center border border-dashed border-border rounded-xl">No ratings have been submitted yet.</p>
                        ) : (
                            ratersList.map(rater => (
                                <div key={rater.profile.id} className="flex flex-col border border-border rounded-xl bg-surface-1 overflow-hidden transition-all shadow-sm shadow-black/5 hover:border-border/80">
                                    {/* Header (Click to expand) */}
                                    <button
                                        onClick={() => setExpandedRaterId(expandedRaterId === rater.profile.id ? null : rater.profile.id)}
                                        className="w-full flex items-center justify-between p-4 bg-surface-1 hover:bg-surface-2 transition-colors cursor-pointer text-left focus:outline-none focus-visible:bg-surface-2"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <Avatar
                                                firstName={rater.profile.first_name}
                                                lastName={rater.profile.last_name}
                                                avatarUrl={rater.profile.avatar_url}
                                                size="sm"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <p className="font-semibold text-sm text-text-primary truncate">
                                                    {rater.profile.first_name} {rater.profile.last_name}
                                                </p>
                                                <p className="text-xs text-text-muted">
                                                    Rated <strong className="text-text-primary">{rater.ratingsMade.length}</strong> players
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 shrink-0">
                                            {/* Sub-badge indicating their leniency/strictness */}
                                            <div className="hidden sm:flex flex-col items-end border-r border-border pr-4">
                                                <span className="text-xs font-mono font-bold text-text-primary">{rater.averageGiven} avg</span>
                                                <span className="text-[9px] uppercase font-bold text-text-muted">given rating</span>
                                            </div>
                                            
                                            <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-surface-3 transition-transform duration-200 ${expandedRaterId === rater.profile.id ? 'rotate-180' : ''}`}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Body */}
                                    {expandedRaterId === rater.profile.id && (
                                        <div className="bg-surface-2/50 border-t border-border p-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Scores given by {rater.profile.first_name}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {rater.ratingsMade.map(r => (
                                                    <div key={r.ratee_id} className="flex justify-between items-center p-2 rounded-md bg-surface-1 border border-border/50">
                                                        <span className="text-sm font-medium text-text-primary truncate max-w-[150px]">
                                                            {r.ratee?.first_name} {r.ratee?.last_name}
                                                        </span>
                                                        <Badge variant="blue" className="font-mono text-xs px-2 py-0.5">
                                                            {r.rating}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

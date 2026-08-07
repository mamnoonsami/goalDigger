'use client'

import { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import Link from 'next/link'

type Player = {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    role: string
    player_position: string | null
    base_score: number
    goals: number
    matches_played: number
    peer_rating_score?: number | null
}

const POSITIONS = ['all players', 'striker', 'midfielder', 'defender', 'goalkeeper'] as const
type PositionTab = typeof POSITIONS[number]

export function PlayersTabs({ players }: { players: Player[] }) {
    const [activeTab, setActiveTab] = useState<PositionTab>('all players')
    const [searchQuery, setSearchQuery] = useState('')

    // Preserve the player's rank within the selected position while searching.
    const rankedPlayers = players
        .filter((player) => activeTab === 'all players' || player.player_position === activeTab)
        .map((player, index) => ({ player, rank: index + 1 }))
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
    const filteredPlayers = rankedPlayers.filter(({ player }) => {
        if (!normalizedQuery) return true

        return `${player.first_name} ${player.last_name} ${player.player_position ?? ''}`
            .toLocaleLowerCase()
            .includes(normalizedQuery)
    })

    return (
        <section aria-labelledby="leaderboard-heading" className="min-w-0">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Leaderboard</p>
                    <h2 id="leaderboard-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-text-primary">Peer rating standings</h2>
                </div>
                <p className="text-xs text-text-muted">{filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'} shown</p>
            </div>

            <Card className="min-w-0 overflow-hidden p-0">
                <div className="border-b border-border bg-surface-1/35 px-3 py-3 sm:px-5 sm:py-4">
                    <div className="mb-3 flex items-center gap-2 sm:mb-4">
                        <label className="relative min-w-0 flex-1">
                            <span className="sr-only">Search players</span>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search by player or position"
                                className="h-11 w-full rounded-xl border border-border bg-surface-2 px-4 pr-20 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Search</span>
                        </label>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="h-11 shrink-0 rounded-xl border border-border bg-surface-2 px-3 text-xs font-semibold text-text-muted transition-colors hover:border-accent/30 hover:text-text-primary"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2" role="tablist" aria-label="Filter players by position">
                        {POSITIONS.map((position) => (
                            <button
                                key={position}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === position}
                                onClick={() => setActiveTab(position)}
                                className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors sm:text-sm lg:px-4 ${
                                    activeTab === position
                                        ? 'border-accent bg-accent text-white shadow-sm shadow-accent/20'
                                        : 'border-border bg-surface-2 text-text-muted hover:border-accent/30 hover:text-text-primary'
                                }`}
                            >
                                {position}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredPlayers.length > 0 ? (
                    <div className="min-w-0">
                        <div className="hidden grid-cols-[3rem_3rem_minmax(0,1.5fr)_minmax(7rem,.75fr)_5rem_5rem_6.5rem_1.5rem] items-center gap-4 border-b border-border bg-surface-2 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted lg:grid">
                            <span className="text-center">Rank</span>
                            <span aria-hidden="true" />
                            <span>Player</span>
                            <span>Position</span>
                            <span className="text-center">Goals</span>
                            <span className="text-center">Matches</span>
                            <span className="text-right">Rating</span>
                            <span aria-hidden="true" />
                        </div>

                        <div className="divide-y divide-border">
                            {filteredPlayers.map(({ player, rank }) => {
                                const score = player.peer_rating_score ?? '—'
                                const isLeader = rank === 1
                                const isTopThree = rank <= 3

                                return (
                                    <Link
                                        key={player.id}
                                        href={`/players/${player.id}`}
                                        className={`group block transition-colors hover:bg-accent/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${isLeader ? 'bg-accent/[0.07]' : ''}`}
                                    >
                                        <div className="grid min-w-0 grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto_1rem] items-center gap-2.5 px-3 py-3.5 lg:grid-cols-[3rem_3rem_minmax(0,1.5fr)_minmax(7rem,.75fr)_5rem_5rem_6.5rem_1.5rem] lg:gap-4 lg:px-5 lg:py-4">
                                            <span className={`flex h-7 w-7 items-center justify-center justify-self-center rounded-lg font-mono text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                                                isLeader
                                                    ? 'bg-accent text-white shadow-sm shadow-accent/25'
                                                    : isTopThree
                                                        ? 'border border-accent/25 bg-accent/10 text-accent'
                                                        : 'text-text-muted'
                                            }`}>
                                                {rank}
                                            </span>

                                            <Avatar
                                                firstName={player.first_name}
                                                lastName={player.last_name}
                                                avatarUrl={player.avatar_url}
                                                size="md"
                                                className="!h-10 !w-10 sm:!h-11 sm:!w-11"
                                            />

                                            <div className="min-w-0">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-accent sm:text-base">
                                                        {player.first_name} {player.last_name}
                                                    </p>
                                                    <Badge variant="slate" className="hidden px-2 py-0 text-[9px] lg:inline-flex">{player.role}</Badge>
                                                </div>
                                                <p className="mt-0.5 truncate text-[11px] capitalize text-text-muted lg:hidden">
                                                    {player.player_position ?? 'Unknown'} · {player.goals}G · {player.matches_played}M
                                                </p>
                                            </div>

                                            <span className="hidden truncate text-sm capitalize text-text-muted lg:block">{player.player_position ?? 'Unknown'}</span>
                                            <span className="hidden text-center font-mono text-sm text-text-primary lg:block">{player.goals}</span>
                                            <span className="hidden text-center font-mono text-sm text-text-primary lg:block">{player.matches_played}</span>

                                            <div className="text-right">
                                                <span className="font-mono text-base font-bold text-accent sm:text-lg">{score}</span>
                                                <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted lg:hidden">Rating</p>
                                            </div>

                                            <svg aria-hidden="true" className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" viewBox="0 0 20 20" fill="none"><path d="m7.5 4 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                            <span className="text-lg font-semibold">0</span>
                        </div>
                        <p className="mt-4 font-medium text-text-primary">No matching players</p>
                        <p className="mt-1 text-sm text-text-muted">{searchQuery ? 'Try a different name or position.' : `No ${activeTab} found in this squad.`}</p>
                    </div>
                )}
            </Card>
        </section>
    )
}

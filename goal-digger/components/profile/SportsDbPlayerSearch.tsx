'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'

interface PlayerResult {
    idPlayer: string
    strPlayer: string
    strTeam: string
    strPosition: string
    strNationality: string
    strThumb: string | null
    strCutout: string | null
    strSport: string
}

export function SportsDbPlayerSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<PlayerResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)
        try {
            const formatted = query.trim().replace(/\s+/g, '_')
            const res = await fetch(
                `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${formatted}`
            )
            const data = await res.json()
            // Filter to soccer players only
            const players: PlayerResult[] = (data.player || []).filter(
                (p: any) => p.strSport === 'Soccer'
            )
            setResults(players)
        } catch {
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <h2 className="font-semibold text-text-primary mb-1">
                ⚽ Player Photo Lookup
                <span className="text-xs font-normal text-text-muted ml-2">(TheSportsDB)</span>
            </h2>
            <p className="text-xs text-text-muted mb-4">
                Search for real soccer players to preview their photos.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Lionel Messi"
                    className="flex-1 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {/* Results */}
            {loading && (
                <div className="text-center text-sm text-text-muted py-6">
                    Searching TheSportsDB...
                </div>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="text-center text-sm text-text-muted py-6">
                    No soccer players found. Try a different name.
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {results.slice(0, 6).map((player) => (
                        <div
                            key={player.idPlayer}
                            className="flex flex-col items-center rounded-xl border border-border bg-surface-1 p-3 gap-2"
                        >
                            {/* Photo */}
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-3 flex-shrink-0">
                                {player.strCutout || player.strThumb ? (
                                    <img
                                        src={(player.strCutout || player.strThumb) + '/small'}
                                        alt={player.strPlayer}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xl">
                                        ?
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="text-center min-w-0 w-full">
                                <p className="text-xs font-semibold text-text-primary truncate">{player.strPlayer}</p>
                                <p className="text-[10px] text-text-muted truncate">{player.strTeam}</p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <span className="text-[10px] text-accent font-medium">{player.strPosition}</span>
                                    {player.strNationality && (
                                        <>
                                            <span className="text-[10px] text-text-muted">·</span>
                                            <span className="text-[10px] text-text-muted truncate">{player.strNationality}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

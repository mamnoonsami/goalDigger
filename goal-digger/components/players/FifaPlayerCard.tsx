'use client'

import { useEffect } from 'react'
import { Avatar } from '../ui/Avatar'

export interface FifaPlayerStats {
    id: string
    first_name: string
    last_name: string
    base_score: number
    goals: number
    matches_played: number
    role: string
    player_position: string | null
    avatar_url: string | null
}

interface FifaPlayerCardProps {
    player: FifaPlayerStats
    onClose: () => void
}

export function FifaPlayerCard({ player, onClose }: FifaPlayerCardProps) {
    const overallRating = player.base_score + player.goals * 2

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Card Container - using surface-3 and no outer gold border */}
            <button
                type="button"
                className="relative w-full max-w-[320px] aspect-[2/3] bg-surface-3 border border-border rounded-t-[3rem] rounded-b-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 group cursor-default overflow-hidden flex flex-col items-center pt-8 pb-8 px-4 text-text-primary"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Faint Background Crest / Pattern */}
                <div className="absolute left-1/2 -translate-x-1/2 w-80 h-80 opacity-[0.06] text-text-primary">
                    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full mt-5">
                        <path d="M50 0 L90 20 L90 60 L50 100 L10 60 L10 20 Z" />
                    </svg>
                </div>

                {/* Top Left: Score & Position */}
                <div className="absolute top-8 left-6 flex flex-col items-center z-10 text-text-primary">
                    <span className="text-5xl font-black tracking-tighter leading-none text-accent">
                        {overallRating}
                    </span>
                    <span className="text-xl font-bold uppercase tracking-tight mt-0.5">
                        {player.player_position?.substring(0, 3) || 'PLY'}
                    </span>
                </div>

                {/* Player Portrait Avatar */}
                <div className="w-28 h-28 mt-12 z-10 flex items-center justify-center drop-shadow-xl relative mb-2">
                    <Avatar
                        firstName={player.first_name}
                        lastName={player.last_name}
                        avatarUrl={player.avatar_url}
                        className="w-full h-full text-4xl shadow-lg border-4 border-surface"
                    />
                </div>

                <div className="flex flex-col items-center w-full z-10 mt-auto">
                    {/* Divider Line */}
                    <div className="w-4/5 h-[1px] bg-border my-2"></div>

                    {/* Player Name */}
                    <h2 className="text-3xl font-black uppercase text-text-primary tracking-wider leading-tight w-full truncate text-center px-2">
                        {player.last_name || player.first_name}
                    </h2>

                    {/* Divider Line */}
                    <div className="w-4/5 h-[1px] bg-border my-2 mb-6"></div>
                </div>

                {/* Stats Grid - Made Larger */}
                <div className="w-full grid grid-cols-4 gap-x-2 mt-2 z-10 px-2 text-text-primary pb-2">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tracking-wider uppercase mb-1 text-text-muted">BAS</span>
                        <span className="text-3xl leading-none font-black">{player.base_score}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tracking-wider uppercase mb-1 text-text-muted">GLS</span>
                        <span className="text-3xl leading-none font-black">{player.goals}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tracking-wider uppercase mb-1 text-text-muted">MAT</span>
                        <span className="text-3xl leading-none font-black">{player.matches_played}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tracking-wider uppercase mb-1 text-text-muted">RLE</span>
                        <span className="text-xl leading-none font-black uppercase mt-1">{player.role.substring(0, 3)}</span>
                    </div>
                </div>

                {/* Close Button X (Inside top right) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors bg-surface-2 hover:bg-surface-3 rounded-full p-2 z-50 border border-border"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </button>
        </div>
    )
}

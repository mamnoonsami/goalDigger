'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import dynamic from 'next/dynamic'

// Wheel component must be dynamically imported because it relies on window/document
// which isn't available during Next.js SSR
const Wheel = dynamic(
    () => import('react-custom-roulette').then((mod) => mod.Wheel),
    { ssr: false }
)

interface SpinPlayer {
    id: string
    name: string
    position: string | null
}

interface PlayerSpinWheelProps {
    players: SpinPlayer[]
    onPlayerSelected?: (player: SpinPlayer) => void
    disabled?: boolean
}

export function PlayerSpinWheel({ players, onPlayerSelected, disabled }: PlayerSpinWheelProps) {
    const [mustSpin, setMustSpin] = useState(false)
    const [prizeNumber, setPrizeNumber] = useState(0)
    const [hasSpun, setHasSpun] = useState(false)

    const handleSpinClick = () => {
        if (!mustSpin && players.length > 0) {
            const newPrizeNumber = Math.floor(Math.random() * players.length)
            setPrizeNumber(newPrizeNumber)
            setMustSpin(true)
            setHasSpun(false)
        }
    }

    if (players.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface-1 p-6 text-center">
                <p className="text-sm text-text-muted">No players available to spin.</p>
            </div>
        )
    }

    // Format data for the wheel
    const wheelData = players.map((player, index) => {
        const isWinner = hasSpun && index === prizeNumber
        return {
            option: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
            style: isWinner
                ? { backgroundColor: '#3b82f6', textColor: '#ffffff' } // Bright blue for winner
                : { textColor: '#ffffff' }
        }
    })

    // Generate colors from our theme palette
    const backgroundColors = [
        '#1E293B', // slate-800
        '#0F172A', // slate-900 (darker)
        '#334155', // slate-700
    ]

    return (
        <div className="rounded-xl border border-border bg-surface-1 p-5 overflow-hidden flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    🎯 Player Spin Wheel
                </h3>
                {mustSpin && (
                    <span className="text-xs font-semibold text-accent animate-pulse">
                        Spinning...
                    </span>
                )}
                {!mustSpin && !hasSpun && (
                    <span className="text-xs text-text-muted">
                        Click the wheel to spin
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] py-4">
                {/* The Wheel */}
                <div
                    className={`relative w-full max-w-[350px] aspect-square flex items-center justify-center transition-transform duration-300 ${mustSpin || disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:scale-105 select-none'
                        }`}
                    onClick={() => {
                        if (!disabled && !mustSpin) handleSpinClick()
                    }}
                    title={disabled || mustSpin ? '' : 'Click to spin the wheel'}
                >
                    <Wheel
                        mustStartSpinning={mustSpin}
                        prizeNumber={prizeNumber}
                        data={wheelData}
                        backgroundColors={backgroundColors}
                        textColors={['#ffffff']}
                        outerBorderColor="#3b82f6" // accent blue
                        outerBorderWidth={6}
                        innerRadius={15}
                        innerBorderColor="#1e293b"
                        innerBorderWidth={5}
                        radiusLineColor="#1e293b"
                        radiusLineWidth={2}
                        fontSize={14}
                        textDistance={65}
                        spinDuration={0.6}
                        pointerProps={{
                            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444'%3E%3Cpath d='M12 2L2 22h20L12 2z'/%3E%3C/svg%3E",
                        }}
                        onStopSpinning={() => {
                            setMustSpin(false)
                            setHasSpun(true)
                            onPlayerSelected?.(players[prizeNumber])
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

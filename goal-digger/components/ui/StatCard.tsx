import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'
import { SlotCounter } from './SlotCounter'

interface StatCardProps {
    label: string
    value: string | number
    icon?: ReactNode
    trend?: { value: number; label: string }
    className?: string
    valueColor?: string
    valueGradient?: string // e.g. "from-amber-600 to-amber-800"
    animated?: boolean
}

export function StatCard({ label, value, icon, trend, className, valueColor, valueGradient, animated }: StatCardProps) {
    const trendUp = trend && trend.value >= 0
    const gradientClasses = valueGradient ? `bg-gradient-to-br ${valueGradient} bg-clip-text text-transparent inline-block` : ''

    return (
        <div
            className={cn(
                'relative rounded-xl border border-border bg-surface-2 p-5 overflow-hidden',
                'flex flex-col gap-3',
                className
            )}
        >
            {/* Faded watermark icon — full height, right-aligned, centered */}
            {icon && (
                <span
                    className="pointer-events-none absolute inset-y-0 flex items-center justify-center text-text-primary opacity-[0.07]"
                    style={{ right: '-25%', width: '55%' }}
                >
                    <span style={{ fontSize: '120px', lineHeight: 1 }}>
                        {icon}
                    </span>
                </span>
            )}

            <span className="text-sm font-medium text-text-muted">{label}</span>
            <div className="flex items-end justify-between gap-2">
                {animated && typeof value === 'number' ? (
                    <div className={cn("font-mono text-4xl font-bold tracking-tight", gradientClasses)} style={valueColor && !valueGradient ? { color: valueColor } : undefined}>
                        <SlotCounter value={value} />
                    </div>
                ) : (
                    <span className={cn("font-mono text-4xl font-bold tracking-tight", gradientClasses || "text-text-primary")} style={valueColor && !valueGradient ? { color: valueColor } : undefined}>
                        {value}
                    </span>
                )}
                {trend && (
                    <span
                        className={cn(
                            'mb-1 text-xs font-medium',
                            trendUp ? 'text-green-400' : 'text-red-400'
                        )}
                    >
                        {trendUp ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
                    </span>
                )}
            </div>
        </div>
    )
}

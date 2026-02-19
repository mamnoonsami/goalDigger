import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
    label: string
    value: string | number
    icon?: ReactNode
    trend?: { value: number; label: string }
    className?: string
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
    const trendUp = trend && trend.value >= 0

    return (
        <div
            className={cn(
                'rounded-xl border border-border bg-surface-2 p-5',
                'flex flex-col gap-3',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">{label}</span>
                {icon && (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        {icon}
                    </span>
                )}
            </div>
            <div className="flex items-end justify-between gap-2">
                <span className="font-mono text-3xl font-bold text-text-primary">{value}</span>
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

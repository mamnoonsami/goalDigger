import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    /** Add a hover lift effect — useful for clickable cards */
    hoverable?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 md:p-8',
}

export function Card({ children, className, hoverable = false, padding = 'md' }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-border bg-surface-2',
                'transition-all duration-200',
                hoverable && 'hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 cursor-pointer',
                paddings[padding],
                className
            )}
        >
            {children}
        </div>
    )
}

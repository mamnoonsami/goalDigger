'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
    className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch — only render icon after mount
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return <div className={cn('h-9 w-9 rounded-lg bg-surface-3', className)} />
    }

    const isDark = theme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'bg-surface-3 text-text-muted hover:text-text-primary hover:bg-surface-2',
                'border border-border transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                className
            )}
        >
            {isDark ? (
                /* Sun icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            ) : (
                /* Moon icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    )
}

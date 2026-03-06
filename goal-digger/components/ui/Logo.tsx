'use client'

import { cn } from '../../lib/utils'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface LogoProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    sm: 'h-10 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-20 w-auto',
}

export function Logo({ size = 'md', className }: LogoProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div
            className={cn(
                'flex-shrink-0 flex items-center justify-center overflow-hidden',
                sizeMap[size],
                className
            )}
        >
            {mounted ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={resolvedTheme === 'dark' ? "/goalDiggerLogoDarkTheme.png" : "/goalDiggerLogo.png"}
                    alt="Goal Digger"
                    className="object-contain h-full w-auto"
                />
            ) : (
                /* Placeholder to prevent layout shift before hydration */
                <div className="h-full w-full opacity-0" />
            )}
        </div>
    )
}


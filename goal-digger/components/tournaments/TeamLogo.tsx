'use client'

import { useState } from 'react'
import { cn } from '../../lib/utils'

interface TeamLogoProps {
    teamName: string
    logoUrl?: string | null
    className?: string
    fallbackClassName?: string
}

export function TeamLogo({ teamName, logoUrl, className, fallbackClassName }: TeamLogoProps) {
    const [imgError, setImgError] = useState(false)

    if (logoUrl && !imgError) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img 
                src={logoUrl} 
                alt={`${teamName} logo`} 
                className={cn("object-cover", className)} 
                onError={() => setImgError(true)}
            />
        )
    }

    return (
        <div className={cn("flex shrink-0 items-center justify-center font-bold text-text-muted bg-surface-3 border border-border", fallbackClassName || className)}>
            {teamName.substring(0, 2).toUpperCase()}
        </div>
    )
}

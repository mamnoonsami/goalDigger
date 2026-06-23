'use client'

import { useState } from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps {
    firstName?: string
    lastName?: string
    avatarUrl?: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    interactive?: boolean
}

const sizes = {
    sm: 'h-8  w-8  text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-24 w-24 text-3xl',
}

function initials(first?: string, last?: string) {
    const f = first?.[0]?.toUpperCase() ?? ''
    const l = last?.[0]?.toUpperCase() ?? ''
    return f + l || '?'
}

export function Avatar({ firstName, lastName, avatarUrl, size = 'md', className, interactive = false }: AvatarProps) {
    const [imgError, setImgError] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fallback = (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-semibold',
                'bg-accent/20 text-accent border-2 border-accent/30',
                sizes[size],
                className
            )}
            aria-label={`${firstName} ${lastName}`}
        >
            {initials(firstName, lastName)}
        </div>
    )

    if (avatarUrl && !imgError) {
        const imgElement = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={`${firstName} ${lastName}`}
                className={cn('rounded-full object-cover border-2 border-border', sizes[size], className)}
                onError={() => setImgError(true)}
            />
        )

        if (interactive) {
            return (
                <>
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(true)}
                        className="transition-transform hover:scale-105 active:scale-95 outline-none rounded-full"
                    >
                        {imgElement}
                    </button>
                    {isModalOpen && (
                        <div 
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                            onClick={() => setIsModalOpen(false)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={avatarUrl} 
                                alt={`${firstName} ${lastName}`}
                                className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button 
                                className="absolute top-4 right-4 text-white hover:text-accent p-2 outline-none"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                    )}
                </>
            )
        }

        return imgElement
    }

    return fallback
}

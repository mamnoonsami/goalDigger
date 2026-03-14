'use client'

import { useState, useEffect } from 'react'

interface LocalTimeProps {
    isoString: string
    format?: 'short' | 'long' | 'date-only'
    className?: string
}

export function LocalTime({ isoString, format = 'long', className }: LocalTimeProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <span className={className}>...</span>
    }

    const date = new Date(isoString)

    let formattedDate = ''
    if (format === 'long') {
        formattedDate = date.toLocaleString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    } else if (format === 'short') {
        formattedDate = date.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    } else if (format === 'date-only') {
        formattedDate = date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        })
    }

    return <span className={className}>{formattedDate}</span>
}

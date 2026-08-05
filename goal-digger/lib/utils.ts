import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDateTime12h(isoOrDate?: string | Date | null): string {
    if (!isoOrDate) return 'TBD'
    const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
    if (isNaN(date.getTime())) return 'TBD'
    return date.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

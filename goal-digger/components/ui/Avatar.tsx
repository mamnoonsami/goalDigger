import { cn } from '../../lib/utils'

interface AvatarProps {
    firstName?: string
    lastName?: string
    avatarUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizes = {
    sm: 'h-8  w-8  text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
}

function initials(first?: string, last?: string) {
    const f = first?.[0]?.toUpperCase() ?? ''
    const l = last?.[0]?.toUpperCase() ?? ''
    return f + l || '?'
}

export function Avatar({ firstName, lastName, avatarUrl, size = 'md', className }: AvatarProps) {
    if (avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={avatarUrl}
                alt={`${firstName} ${lastName}`}
                className={cn('rounded-full object-cover border-2 border-border', sizes[size], className)}
            />
        )
    }

    return (
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
}

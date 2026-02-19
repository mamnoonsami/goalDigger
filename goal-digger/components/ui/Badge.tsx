import { cn } from '../../lib/utils'

type Variant = 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'purple'

interface BadgeProps {
    children: React.ReactNode
    variant?: Variant
    className?: string
}

const variants: Record<Variant, string> = {
    green: 'bg-green-500/15  text-green-400  border-green-500/20',
    blue: 'bg-blue-500/15   text-blue-400   border-blue-500/20',
    amber: 'bg-amber-500/15  text-amber-400  border-amber-500/20',
    red: 'bg-red-500/15    text-red-400    border-red-500/20',
    slate: 'bg-slate-500/15  text-slate-400  border-slate-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
}

/** Role → colour mapping */
export const roleVariant: Record<string, Variant> = {
    admin: 'green',
    manager: 'blue',
    player: 'amber',
    viewer: 'slate',
}

/** Match status → colour mapping */
export const statusVariant: Record<string, Variant> = {
    open: 'green',
    balanced: 'blue',
    in_progress: 'amber',
    completed: 'slate',
    cancelled: 'red',
}

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5',
                'text-xs font-semibold uppercase tracking-wide',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    )
}

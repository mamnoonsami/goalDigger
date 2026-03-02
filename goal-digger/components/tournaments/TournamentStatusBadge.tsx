interface TournamentStatusBadgeProps {
    status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: {
        label: 'Draft',
        className: 'bg-surface-3 text-text-muted border-border',
    },
    auction: {
        label: 'Auction',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    active: {
        label: 'Active',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    completed: {
        label: 'Completed',
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    },
}

export function TournamentStatusBadge({ status }: TournamentStatusBadgeProps) {
    const config = statusConfig[status] ?? statusConfig.draft

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${config.className}`}
        >
            {config.label}
        </span>
    )
}

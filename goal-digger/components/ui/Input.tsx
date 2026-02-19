import { cn } from '../../lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'h-11 w-full rounded-lg border px-3.5 text-sm',
                    'bg-surface-3 text-text-primary placeholder:text-text-muted',
                    'border-border transition-colors duration-150',
                    'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
                    error && 'border-danger focus:border-danger focus:ring-danger/20',
                    className
                )}
                {...props}
            />
            {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
            {error && <p className="text-xs text-danger">{error}</p>}
        </div>
    )
}

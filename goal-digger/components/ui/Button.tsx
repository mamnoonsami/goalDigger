'use client'

import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    isLoading?: boolean
    fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
    primary: 'bg-accent text-white hover:bg-[var(--accent-hover)] active:scale-[0.98]',
    secondary: 'bg-surface-3 text-text-primary border border-border hover:bg-surface-2',
    ghost: 'text-text-primary hover:bg-surface-3',
    danger: 'bg-danger text-white hover:bg-[var(--danger-hover)] active:scale-[0.98]',
}

const sizeStyles: Record<Size, string> = {
    sm: 'h-8  px-3 text-sm  gap-1.5',
    md: 'h-11 px-4 text-sm  gap-2',
    lg: 'h-12 px-6 text-base gap-2',
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || isLoading}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium',
                'transition-all duration-150 cursor-pointer',
                'disabled:opacity-50 disabled:pointer-events-none',
                'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {isLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            ) : null}
            {children}
        </button>
    )
}

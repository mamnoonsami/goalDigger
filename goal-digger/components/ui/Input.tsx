'use client'

import { cn } from '../../lib/utils'
import { useState, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

export function Input({ label, error, hint, className, id, type, ...props }: InputProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    
    // Determine the actual input type
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                <input
                    id={inputId}
                    type={inputType}
                    className={cn(
                        'h-11 w-full rounded-lg border px-3.5 text-sm',
                        'bg-surface-3 text-text-primary placeholder:text-text-muted',
                        'border-border transition-colors duration-150',
                        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
                        error && 'border-danger focus:border-danger focus:ring-danger/20',
                        isPassword && 'pr-10', // padding so text doesn't hide behind icon
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                        onMouseLeave={() => setShowPassword(false)}
                        onTouchStart={() => setShowPassword(true)}
                        onTouchEnd={() => setShowPassword(false)}
                        title="Hold to show password"
                    >
                        {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
            {error && <p className="text-xs text-danger">{error}</p>}
        </div>
    )
}

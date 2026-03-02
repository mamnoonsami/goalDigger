'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

/* ── Types ────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextValue {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/* ── Hook ─────────────────────────────────────────── */
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
    return ctx
}

/* ── Auto-dismiss duration ────────────────────────── */
const TOAST_DURATION = 4000

/* ── Provider ─────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const [exiting, setExiting] = useState<Set<string>>(new Set())

    const dismiss = useCallback((id: string) => {
        setExiting(prev => new Set(prev).add(id))
        // Wait for exit animation before removing
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
            setExiting(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }, 300)
    }, [])

    const push = useCallback((type: ToastType, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => dismiss(id), TOAST_DURATION)
    }, [dismiss])

    const value: ToastContextValue = {
        success: useCallback((msg: string) => push('success', msg), [push]),
        error: useCallback((msg: string) => push('error', msg), [push]),
        warning: useCallback((msg: string) => push('warning', msg), [push]),
    }

    const accentColors: Record<ToastType, string> = {
        success: '#16a34a',
        error: '#ef4444',
        warning: '#eab308',
    }

    const iconPaths: Record<ToastType, ReactNode> = {
        success: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
        error: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        ),
        warning: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    }

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast container */}
            {toasts.length > 0 && (
                <div className="toast-container" role="status" aria-live="polite">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`toast-item ${exiting.has(toast.id) ? 'toast-exit' : 'toast-enter'}`}
                            style={{ '--toast-accent': accentColors[toast.type] } as React.CSSProperties}
                            onClick={() => dismiss(toast.id)}
                        >
                            <div className="toast-accent-bar" />
                            <div className="toast-icon" style={{ color: accentColors[toast.type] }}>
                                {iconPaths[toast.type]}
                            </div>
                            <p className="toast-message">{toast.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    )
}

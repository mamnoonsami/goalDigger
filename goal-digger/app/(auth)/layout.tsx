import type { ReactNode } from 'react'
import { Logo } from '../../components/ui/Logo'

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--surface-1)' }}>
            {/* Subtle green glow behind the card */}
            <div
                className="pointer-events-none fixed inset-0 -z-10"
                style={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(22,163,74,0.18) 0%, transparent 70%)'
                }}
            />
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-2 text-center">
                    <Logo size="lg" />
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Goal Digger</h1>
                    <p className="text-sm text-text-muted">Your soccer squad management platform</p>
                </div>
                {children}
                <footer className="mt-8 text-center">
                    <p className="text-xs text-text-muted">© 2026 Goal Digger</p>
                </footer>
            </div>
        </div>
    )
}

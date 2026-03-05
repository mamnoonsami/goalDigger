'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const confirmed = searchParams.get('confirmed')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createBrowserSupabaseClient()
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
            if (authError) {
                setError(authError.message.toLowerCase().includes('email not confirmed')
                    ? 'email_not_confirmed'
                    : authError.message)
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            {error === 'email_not_confirmed' && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M22 4L12 13L2 4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>Email not confirmed</p>
                        <p className="text-xs text-text-muted">Please check your email and confirm your account first.</p>
                    </div>
                </div>
            )}
            {confirmed === 'true' && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-accent">Email confirmed!</p>
                        <p className="text-xs text-text-muted">Thank you for verifying your email. You can now sign in.</p>
                    </div>
                </div>
            )}
            {confirmed === 'error' && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
                    <p className="text-sm text-danger">Email confirmation failed or link expired. Please try signing up again.</p>
                </div>
            )}
            <h2 className="mb-6 text-xl font-semibold text-text-primary">Sign in</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    error={error && error !== 'email_not_confirmed' ? error : undefined}
                />
                <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                    Sign in
                </Button>
            </form>
            <p className="mt-5 text-center text-sm text-text-muted">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-accent hover:underline">
                    Sign up
                </Link>
            </p>
        </Card>
    )
}

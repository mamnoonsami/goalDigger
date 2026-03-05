'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function SignupPage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createBrowserSupabaseClient()
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { first_name: firstName, last_name: lastName },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (authError) {
                setError(authError.message)
            } else {
                setSubmitted(true)
            }
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <Card>
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M22 4L12 13L2 4" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary">Check your email</h2>
                    <p className="text-sm text-text-muted leading-relaxed">
                        We&apos;ve sent a confirmation link to<br />
                        <span className="font-medium text-text-primary">{email}</span>
                    </p>
                    <p className="text-xs text-text-muted">
                        Click the link in the email to activate your account, then come back to sign in.
                    </p>
                    <Link href="/login" className="mt-2 text-sm font-medium text-accent hover:underline">
                        ← Back to sign in
                    </Link>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <h2 className="mb-6 text-xl font-semibold text-text-primary">Create account</h2>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="First name"
                        type="text"
                        placeholder="Ali"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name"
                    />
                    <Input
                        label="Last name"
                        type="text"
                        placeholder="Hassan"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name"
                    />
                </div>
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
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    hint="At least 8 characters"
                    error={error || undefined}
                />
                <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                    Create account
                </Button>
            </form>
            <p className="mt-5 text-center text-sm text-text-muted">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-accent hover:underline">
                    Sign in
                </Link>
            </p>
        </Card>
    )
}

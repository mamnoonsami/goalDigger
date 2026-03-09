'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    async function handleResetRequest(e: React.FormEvent) {
        e.preventDefault()

        if (!email) {
            setStatus('error')
            setMessage('Please enter your email address')
            return
        }

        setStatus('loading')
        setMessage('')

        try {
            const supabase = createBrowserSupabaseClient()

            // Send the password reset email. 
            // The redirectTo parameter tells Supabase where to send the user after they click the link in the email.
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            })

            if (error) {
                setStatus('error')
                setMessage(error.message)
            } else {
                setStatus('success')
                setMessage('Check your email for the password reset link.')
            }
        } catch (err: unknown) {
            setStatus('error')
            if (err instanceof Error) {
                setMessage(err.message)
            } else {
                setMessage('An unexpected error occurred')
            }
        }
    }

    if (status === 'success') {
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
                        We&apos;ve sent a password reset link to<br />
                        <span className="font-medium text-text-primary">{email}</span>
                    </p>
                    <p className="text-xs text-text-muted">
                        Click the link in the email to set a new password.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 w-full sm:w-auto">
                        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
                            ← Back to sign in
                        </Link>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <div className="mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-text-primary text-center">Reset your password</h2>
                <p className="mt-2 text-sm text-text-muted text-center">
                    Enter your email and we&apos;ll send you a link to reset your password.
                </p>
            </div>

            {status === 'error' && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
                    <p className="text-sm text-danger">{message}</p>
                </div>
            )}

            <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={status === 'loading'}
                />
                <Button type="submit" fullWidth isLoading={status === 'loading'} className="mt-2">
                    Send reset link
                </Button>
            </form>
            <p className="mt-5 text-center text-sm text-text-muted">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-accent hover:underline">
                    Sign in
                </Link>
            </p>
        </Card>
    )
}

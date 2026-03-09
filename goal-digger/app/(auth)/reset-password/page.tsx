'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()

        if (password !== confirmPassword) {
            setStatus('error')
            setMessage('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setStatus('error')
            setMessage('Password must be at least 6 characters long')
            return
        }

        setStatus('loading')
        setMessage('')

        try {
            const supabase = createBrowserSupabaseClient()

            // Because the user just clicked the link in their email, 
            // the auth/callback route exchanged the token for a session.
            // They are now technically "logged in" and we can just update their user.
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setStatus('error')
                setMessage(error.message)
            } else {
                setStatus('success')
                setMessage('Your password has been updated successfully.')
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
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary">Password updated</h2>
                    <p className="text-sm text-text-muted leading-relaxed">
                        {message}
                    </p>
                    <div className="mt-4 flex flex-col gap-3 w-full sm:w-auto">
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
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
                <h2 className="text-xl font-semibold text-text-primary text-center">Set new password</h2>
                <p className="mt-2 text-sm text-text-muted text-center">
                    Please enter your new password below.
                </p>
            </div>

            {status === 'error' && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
                    <p className="text-sm text-danger">{message}</p>
                </div>
            )}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={status === 'loading'}
                    hint="At least 6 characters"
                />
                <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={status === 'loading'}
                />
                <Button type="submit" fullWidth isLoading={status === 'loading'} className="mt-2">
                    Update password
                </Button>
            </form>
            <p className="mt-5 text-center text-sm text-text-muted">
                <Link href="/login" className="font-medium text-accent hover:underline">
                    Back to sign in
                </Link>
            </p>
        </Card>
    )
}

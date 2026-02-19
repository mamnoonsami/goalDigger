'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function LoginPage() {
    const router = useRouter()
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
                setError(authError.message)
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
                    error={error || undefined}
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

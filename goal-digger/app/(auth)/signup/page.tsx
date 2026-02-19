'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function SignupPage() {
    const router = useRouter()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
                },
            })
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

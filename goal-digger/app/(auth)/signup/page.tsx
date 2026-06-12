'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'

export default function SignupPage() {
    return (
        <Suspense fallback={<Card className="animate-pulse h-[400px]"><div className="h-full w-full" /></Card>}>
            <SignupForm />
        </Suspense>
    )
}

function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [tenantId, setTenantId] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Pre-fill invite/tenant ID from URL parameter "invite"
    useEffect(() => {
        const inviteParam = searchParams.get('invite')
        if (inviteParam) {
            setTenantId(inviteParam)
        }
    }, [searchParams])

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const trimmedTenantId = tenantId.trim()
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        if (!uuidRegex.test(trimmedTenantId)) {
            setError('Invalid Group ID format. It must be a valid UUID (e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).')
            setLoading(false)
            return
        }

        try {
            const supabase = createBrowserSupabaseClient()

            // 1. Verify if tenant_id exists in the database
            const { data: tenant, error: tenantError } = await supabase
                .from('tenants')
                .select('id, name')
                .eq('id', trimmedTenantId)
                .maybeSingle()

            if (tenantError || !tenant) {
                setError('Group ID not found. Please obtain a valid Group ID from your Admin/King.')
                setLoading(false)
                return
            }

            // 2. Perform signup and attach tenant_id in raw_user_meta_data
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        tenant_id: trimmedTenantId
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (authError) {
                setError(authError.message)
            } else {
                router.push(`/verify?email=${encodeURIComponent(email)}`)
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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
                        disabled={loading}
                    />
                    <Input
                        label="Last name"
                        type="text"
                        placeholder="Hassan"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name"
                        disabled={loading}
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
                    disabled={loading}
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    hint="At least 8 characters"
                />
                <Input
                    label="Group ID"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    required
                    disabled={loading}
                    hint="Please enter the Group ID supplied by the Admin."
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


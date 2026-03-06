'use client'

import { useState, Suspense, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export default function VerifyPage() {
    return (
        <Suspense>
            <VerifyForm />
        </Suspense>
    )
}

function VerifyForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailFromUrl = searchParams.get('email')

    const [email, setEmail] = useState(emailFromUrl || '')
    const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Create refs array inside the component where useRef is available
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ]

    useEffect(() => {
        // Focus the first empty input, or the first input if all are empty
        if (inputRefs[0] && inputRefs[0].current) {
            inputRefs[0].current.focus()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (code[index] === '') {
                // If current input is empty and user presses backspace, move to previous
                if (index > 0) {
                    const newCode = [...code]
                    newCode[index - 1] = ''
                    setCode(newCode)
                    inputRefs[index - 1].current?.focus()
                }
            } else {
                // If current input has value, just clear it
                const newCode = [...code]
                newCode[index] = ''
                setCode(newCode)
            }
        }
    }

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        // Handle pasting a full 8-digit code
        if (value.length > 1) {
            const pastedCode = value.replace(/\D/g, '').slice(0, 8)
            if (pastedCode) {
                const newCode = [...code]
                for (let i = 0; i < pastedCode.length; i++) {
                    newCode[i] = pastedCode[i]
                }
                setCode(newCode)

                // Focus the next empty input, or the last one if full
                const nextIndex = Math.min(pastedCode.length, 7)
                inputRefs[nextIndex].current?.focus()

                // If we pasted a full 8 digits, auto-submit
                if (pastedCode.length === 8 && email) {
                    verifyCode(email, pastedCode)
                }
            }
            return
        }

        // Handle single digit input
        const digit = value.replace(/\D/g, '')
        if (digit) {
            const newCode = [...code]
            newCode[index] = digit
            setCode(newCode)

            // Move to next input if there is one
            if (index < 7) {
                inputRefs[index + 1].current?.focus()
            }

            // Auto submit if this was the last digit
            if (index === 7 && email && newCode.every(d => d !== '')) {
                verifyCode(email, newCode.join(''))
            }
        }
    }

    async function handleVerifySubmit(e: React.FormEvent) {
        e.preventDefault()

        const fullCode = code.join('')
        if (fullCode.length !== 8) {
            setError('Please enter the 8-digit code')
            return
        }

        if (!email) {
            setError('Email is required')
            return
        }

        await verifyCode(email, fullCode)
    }

    async function verifyCode(userEmail: string, verificationCode: string) {
        setError('')
        setLoading(true)

        try {
            const supabase = createBrowserSupabaseClient()
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: userEmail,
                token: verificationCode,
                type: 'signup'
            })

            if (verifyError) {
                setError(verifyError.message)
                setCode(['', '', '', '', '', '', '', ''])
                inputRefs[0].current?.focus()
            } else {
                // Success! Redirect to dashboard or login
                router.push('/dashboard')
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleResend() {
        if (!email) return

        setError('')
        setLoading(true)

        try {
            const supabase = createBrowserSupabaseClient()
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email
            })

            if (resendError) {
                setError(resendError.message)
            } else {
                // Alert the user that a new code was sent
                alert('A new code has been sent to your email.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Verify your email</h2>
                <p className="mt-2 text-sm text-text-muted">
                    We&apos;ve sent an 8-digit code to<br />
                    <span className="font-medium text-text-primary">{email}</span>
                </p>
            </div>

            {error && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
                    <p className="text-sm text-danger">{error}</p>
                </div>
            )}

            <form onSubmit={handleVerifySubmit} className="flex flex-col gap-6">
                <div className="flex justify-center gap-2 sm:gap-3">
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            ref={inputRefs[i]}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={8}
                            value={digit}
                            onChange={(e) => handleChange(i, e)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="h-10 w-8 sm:h-12 sm:w-10 rounded-lg border border-border bg-surface-2 text-center text-lg font-bold text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                            disabled={loading}
                        />
                    ))}
                </div>

                <Button type="submit" fullWidth isLoading={loading} className="mt-2">
                    Verify account
                </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-text-muted">
                    Didn&apos;t receive a code?{' '}
                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="font-medium text-accent hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                        Resend code
                    </button>
                </p>
                <p className="text-sm text-text-muted">
                    <Link href="/login" className="font-medium hover:text-text-primary hover:underline transition-colors">
                        ← Back to sign in
                    </Link>
                </p>
            </div>
        </Card>
    )
}

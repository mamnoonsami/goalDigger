'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@goaldigger/core'
import { Button } from '../ui/Button'

/* ── Config ───────────────────────────────────────── */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000       // 15 min
const WARNING_BEFORE_MS = 2 * 60 * 1000        // show modal 2 min before expiry
const WARNING_AT_MS = SESSION_TIMEOUT_MS - WARNING_BEFORE_MS // 55 min
const ACTIVITY_THROTTLE = 15_000               // throttle activity resets

/* ── Component ────────────────────────────────────── */
export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [showWarning, setShowWarning] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(0)

    // Refs that survive re-renders
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const lastActivityRef = useRef(Date.now())
    const isWarningRef = useRef(false)   // mirror of showWarning for the event handler

    /* ── Sign out helper ─────────────────────────── */
    const signOut = useCallback(async () => {
        clearAllTimers()
        isWarningRef.current = false
        setShowWarning(false)
        const supabase = createBrowserSupabaseClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }, [router])

    /* ── Timer management ────────────────────────── */
    function clearAllTimers() {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
        warningTimerRef.current = null
        logoutTimerRef.current = null
        countdownRef.current = null
    }

    const startTimers = useCallback(() => {
        clearAllTimers()
        isWarningRef.current = false
        setShowWarning(false)

        // Timer 1 — show warning modal at 55 min
        warningTimerRef.current = setTimeout(() => {
            isWarningRef.current = true
            setShowWarning(true)
            setSecondsLeft(Math.round(WARNING_BEFORE_MS / 1000))

            // Countdown every second
            countdownRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current!)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }, WARNING_AT_MS)

        // Timer 2 — auto-logout at 60 min
        logoutTimerRef.current = setTimeout(() => {
            signOut()
        }, SESSION_TIMEOUT_MS)
    }, [signOut])

    /* ── Activity tracking ───────────────────────── */
    useEffect(() => {
        startTimers()

        function handleActivity() {
            const now = Date.now()
            // Throttle: only reset if enough time has passed
            if (now - lastActivityRef.current < ACTIVITY_THROTTLE) return
            lastActivityRef.current = now
            // Only reset if the warning modal is NOT showing
            if (!isWarningRef.current) {
                startTimers()
            }
        }

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'] as const
        events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))

        return () => {
            clearAllTimers()
            events.forEach(e => window.removeEventListener(e, handleActivity))
        }
    }, [startTimers])

    /* ── Extend session ──────────────────────────── */
    function handleExtend() {
        isWarningRef.current = false
        setShowWarning(false)
        lastActivityRef.current = Date.now()
        startTimers()
    }

    /* ── Format mm:ss ────────────────────────────── */
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`

    return (
        <>
            {children}

            {showWarning && (
                <div className="session-timeout-backdrop" id="session-timeout-modal">
                    <div className="session-timeout-card">
                        {/* Warning icon */}
                        <div className="session-timeout-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h2 className="text-lg font-bold text-text-primary">
                            Session Expiring
                        </h2>

                        {/* Message */}
                        <p className="text-sm text-text-muted text-center leading-relaxed">
                            Your session will expire due to inactivity.
                            <br />
                            Would you like to continue?
                        </p>

                        {/* Countdown */}
                        <div className="session-timeout-countdown">
                            <span className="session-timeout-countdown-time">{display}</span>
                            <span className="text-xs text-text-muted">remaining</span>
                        </div>

                        {/* Progress bar */}
                        <div className="session-timeout-progress-track">
                            <div
                                className="session-timeout-progress-bar"
                                style={{
                                    width: `${(secondsLeft / (WARNING_BEFORE_MS / 1000)) * 100}%`,
                                }}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 w-full mt-1">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={signOut}
                                id="session-timeout-logout"
                            >
                                Logout
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleExtend}
                                id="session-timeout-extend"
                            >
                                Extend Session
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { useChatStore } from '../../store/chatStore'

// Provider that initialises the unread count on mount and listens for new messages via Realtime.
// It lives inside AppShell so it runs for every page inside the (app) group.
export function ChatProvider({ initialUnreadCount }: { initialUnreadCount: number }) {
    const pathname = usePathname()
    const pathnameRef = useRef(pathname)
    const userIdRef = useRef<string | null>(null)
    const setUnreadCount = useChatStore((s) => s.setUnreadCount)
    const incrementUnread = useChatStore((s) => s.incrementUnread)

    // Keep ref in sync with latest pathname (so the Realtime callback always reads it up-to-date)
    useEffect(() => {
        pathnameRef.current = pathname
    }, [pathname])

    // Seed the store with the SSR-computed count on first load, and get user ID
    useEffect(() => {
        setUnreadCount(initialUnreadCount)
        createClient().auth.getUser().then(({ data }) => {
            userIdRef.current = data.user?.id ?? null
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Subscribe to new messages via Realtime once on mount
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('global-chat-new-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'global_messages' },
                (payload) => {
                    const raw = payload.new as { user_id: string }
                    // Only increment badge and play sound when the user is NOT on the chat page
                    if (!pathnameRef.current.startsWith('/chat')) {
                        incrementUnread()
                        if (raw.user_id && raw.user_id !== userIdRef.current) {
                            try {
                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                                const oscillator = ctx.createOscillator()
                                const gainNode = ctx.createGain()
                                oscillator.connect(gainNode)
                                gainNode.connect(ctx.destination)
                                oscillator.type = 'sine'
                                oscillator.frequency.setValueAtTime(880, ctx.currentTime)
                                oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15)
                                gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
                                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
                                oscillator.start(ctx.currentTime)
                                oscillator.stop(ctx.currentTime + 0.4)
                            } catch { } // Silently fail if audio context isn't available
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return null
}

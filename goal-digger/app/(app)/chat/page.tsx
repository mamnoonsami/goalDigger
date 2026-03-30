'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useChatStore } from '../../../store/chatStore'
import type { ChatMessage } from '../../../store/chatStore'

const MAX_MESSAGE_LENGTH = 1000
const MESSAGES_TO_LOAD = 80
const SWIPE_THRESHOLD = 60 // px to trigger reply on desktop drag

// ─── Audio ────────────────────────────────────────────────────────────────────
export function playDing() {
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
    } catch {
        // Silently fail if audio context isn't available
    }
}

export function playDingReply() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = 600
        g.gain.setValueAtTime(0.15, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start(); osc.stop(ctx.currentTime + 0.2)
    } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(firstName: string, lastName: string) {
    return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    if (isYesterday) return `Yesterday ${time}`
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

function formatDateDivider(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return 'Today'
    if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function shouldShowDivider(prev: ChatMessage | undefined, curr: ChatMessage) {
    if (!prev) return true
    return new Date(prev.created_at).toDateString() !== new Date(curr.created_at).toDateString()
}

// ─── Reply Quote Strip (inside message bubble) ────────────────────────────────
function ReplyQuote({ replyTo, onClick, isOwn }: { replyTo: NonNullable<ChatMessage['reply_to']>; onClick: () => void; isOwn: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-lg border-l-2 px-2.5 py-1.5 mb-1.5 transition-colors ${isOwn
                ? 'border-white/60 bg-white/10 hover:bg-white/20'
                : 'border-accent/60 bg-black/5 hover:bg-black/10 dark:bg-accent/10 dark:hover:bg-accent/20'
                }`}
        >
            <p className={`text-[10px] font-semibold mb-0.5 truncate ${isOwn ? 'text-white/90' : 'text-accent/90'}`}>
                {replyTo.sender_name ?? 'Unknown'}
            </p>
            <p className={`text-[11px] truncate ${isOwn ? 'text-white/80' : 'opacity-75'}`}>
                {replyTo.message}
            </p>
        </button>
    )
}

// ─── Message Row ──────────────────────────────────────────────────────────────
interface MessageRowProps {
    msg: ChatMessage
    isOwn: boolean
    sameAuthorAsPrev: boolean
    sameAuthorAsNext: boolean
    showTime: boolean
    onReply: (msg: ChatMessage) => void
    onScrollTo: (id: string) => void
}

function MessageRow({ msg, isOwn, sameAuthorAsPrev, sameAuthorAsNext, showTime, onReply, onScrollTo }: MessageRowProps) {
    const [swipeX, setSwipeX] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)
    const [triggered, setTriggered] = useState(false)
    const [showContextMenu, setShowContextMenu] = useState(false)

    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const dragStartX = useRef(0)
    const isDragging = useRef(false)
    const holdTimer = useRef<NodeJS.Timeout | null>(null)

    // ── Touch (mobile swipe right or left) ──
    function onTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        setTriggered(false)
        setShowContextMenu(false)

        holdTimer.current = setTimeout(() => {
            setShowContextMenu(true)
            if (navigator.vibrate) navigator.vibrate(50)
        }, 500)
    }

    function onTouchMove(e: React.TouchEvent) {
        if (holdTimer.current) clearTimeout(holdTimer.current)

        const dx = e.touches[0].clientX - touchStartX.current
        const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
        if (dy > 20) return // scrolling vertically — ignore

        const swipeAmount = isOwn ? -dx : dx
        if (swipeAmount > 0) {
            setIsSwiping(true)
            const clamped = Math.min(swipeAmount, SWIPE_THRESHOLD + 20)
            setSwipeX(clamped)
        }
    }

    function onTouchEnd() {
        if (holdTimer.current) clearTimeout(holdTimer.current)

        if (isSwiping && Math.abs(swipeX) >= SWIPE_THRESHOLD && !triggered) {
            setTriggered(true)
            onReply(msg)
            playDingReply()
        }
        setSwipeX(0)
        setIsSwiping(false)
    }

    // ── Mouse drag (desktop swipe right or left) ──
    function onMouseDown(e: React.MouseEvent) {
        dragStartX.current = e.clientX
        isDragging.current = true
        setTriggered(false)
    }

    function onMouseMove(e: React.MouseEvent) {
        if (!isDragging.current) return
        const dx = e.clientX - dragStartX.current
        const swipeAmount = isOwn ? -dx : dx
        if (swipeAmount > 0) {
            setIsSwiping(true)
            const clamped = Math.min(swipeAmount, SWIPE_THRESHOLD + 20)
            setSwipeX(clamped)
        }
    }

    function onMouseUp() {
        if (isDragging.current && Math.abs(swipeX) >= SWIPE_THRESHOLD && !triggered) {
            setTriggered(true)
            onReply(msg)
            playDingReply()
        }
        isDragging.current = false
        setSwipeX(0)
        setIsSwiping(false)
    }

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className={`group relative flex flex-col ${isOwn ? 'items-end' : 'items-start'} px-2 select-none ${sameAuthorAsPrev ? 'mt-0.5' : 'mt-3'}`}
            style={{ zIndex: isSwiping ? 10 : 1 }}
        >
            {/* Content Row: Avatar + (Name & Bubble) */}
            <div className={`flex items-end gap-2.5 w-full ${isOwn ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}>
                {/* Avatar */}
                {!sameAuthorAsNext ? (
                    <div className="shrink-0 z-10">
                        {msg.sender?.avatar_url ? (
                            <img
                                src={msg.sender.avatar_url}
                                alt={`${msg.sender?.first_name} ${msg.sender?.last_name}`}
                                className="h-7 w-7 rounded-full object-cover ring-2 ring-[var(--color-surface-2)]"
                            />
                        ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent ring-2 ring-[var(--color-surface-2)]">
                                {msg.sender ? getInitials(msg.sender.first_name, msg.sender.last_name) : '?'}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-7 shrink-0 z-10" />
                )}

                {/* Column wrapper (Name, BubbleRow) */}
                <div
                    className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} z-10 relative`}
                    style={{
                        transform: `translateX(${isOwn ? -swipeX : swipeX}px)`,
                        transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                >
                    {!sameAuthorAsPrev && (
                        <span className={`text-xs font-semibold text-text-muted mb-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {isOwn ? 'You' : msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown'}
                        </span>
                    )}

                    {/* Bubble + reply button */}
                    <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row' : 'flex-row-reverse'} w-full ${isOwn ? 'justify-end' : 'justify-start'} relative`}>
                        {/* Context Menu Overlay for Mobile */}
                        {showContextMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onTouchStart={() => setShowContextMenu(false)}
                                    onMouseDown={() => setShowContextMenu(false)}
                                />
                                <div className={`absolute -top-12 z-50 flex items-center justify-center bg-surface-3 shadow-xl shadow-black/10 border border-border rounded-lg p-1 animate-in fade-in zoom-in-95 duration-200 ${isOwn ? 'right-0' : 'left-0'}`}>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(msg.message)
                                            setShowContextMenu(false)
                                        }}
                                        className="text-sm font-semibold text-text-primary hover:text-accent px-4 py-1.5 active:bg-surface-2 rounded-md transition-colors whitespace-nowrap"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Hover reply button */}
                        <button
                            onClick={() => onReply(msg)}
                            title="Reply"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 hidden md:flex items-center justify-center rounded-full bg-surface-3 text-text-muted hover:text-accent hover:bg-accent/10"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 17 4 12 9 7" />
                                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                            </svg>
                        </button>

                        <div
                            id={`msg-${msg.id}`}
                            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words sm:select-text sm:cursor-text select-none cursor-default ${isOwn
                                ? 'bg-accent text-white rounded-br-sm'
                                : 'bg-surface-2 text-text-primary rounded-bl-sm border border-border'
                                }`}
                        >
                            {/* Reply-to quote */}
                            {msg.reply_to && (
                                <ReplyQuote
                                    replyTo={msg.reply_to}
                                    onClick={() => onScrollTo(msg.reply_to!.id)}
                                    isOwn={isOwn}
                                />
                            )}
                            {msg.message}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timestamp (below avatar and bubble) */}
            {showTime && (
                <div className={`mt-1 flex w-full ${isOwn ? 'justify-end pr-[38px]' : 'justify-start pl-[38px]'}`}>
                    <span className="text-[10px] text-text-muted">
                        {formatTime(msg.created_at)}
                    </span>
                </div>
            )}

            {/* Swipe indicator arrow */}
            <div
                className="absolute flex items-center justify-center h-7 w-7 rounded-full bg-accent/90 text-white top-1/2"
                style={{
                    [isOwn ? 'right' : 'left']: isOwn ? '16px' : '52px',
                    opacity: Math.min(swipeX / SWIPE_THRESHOLD, 1),
                    transform: `translateY(-50%) scale(${0.5 + 0.5 * Math.min(swipeX / SWIPE_THRESHOLD, 1)})`,
                    transition: isSwiping ? 'none' : 'opacity 0.25s, transform 0.25s',
                    zIndex: 0,
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const msgRefs = useRef<Map<string, HTMLElement>>(new Map())
    const clearUnread = useChatStore((s) => s.clearUnread)
    const supabase = createClient()

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        bottomRef.current?.scrollIntoView({ behavior })
    }, [])

    const markAsRead = useCallback(async () => {
        clearUnread()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await supabase
            .from('profiles')
            .update({ last_read_chat_at: new Date().toISOString() })
            .eq('id', user.id)
    }, [clearUnread, supabase])

    // Build a full ChatMessage with profile + reply_to data from raw DB rows
    const buildMessages = useCallback(async (
        msgs: Array<{ id: string; user_id: string; message: string; created_at: string; reply_to_id?: string | null }>,
        profileMap: Record<string, { id: string; first_name: string; last_name: string; avatar_url: string | null }>
    ): Promise<ChatMessage[]> => {
        // Collect any reply_to_ids we need to fetch
        const replyIds = [...new Set(msgs.filter(m => m.reply_to_id).map(m => m.reply_to_id!))]
        let replyMap: Record<string, { id: string; message: string; user_id: string }> = {}

        if (replyIds.length > 0) {
            const { data: replyMsgs } = await supabase
                .from('global_messages')
                .select('id, message, user_id')
                .in('id', replyIds)
            replyMap = Object.fromEntries((replyMsgs ?? []).map(r => [r.id, r]))
        }

        return msgs.map(m => {
            const reply = m.reply_to_id ? replyMap[m.reply_to_id] : null
            const replySender = reply ? profileMap[reply.user_id] : null
            return {
                ...m,
                sender: profileMap[m.user_id] ?? undefined,
                reply_to: reply
                    ? {
                        id: reply.id,
                        message: reply.message,
                        user_id: reply.user_id,
                        sender_name: replySender
                            ? `${replySender.first_name} ${replySender.last_name}`
                            : 'Unknown',
                    }
                    : null,
            }
        })
    }, [supabase])

    // Initial load
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id ?? null)

            const { data: msgs, error } = await supabase
                .from('global_messages')
                .select('id, user_id, message, created_at, reply_to_id')
                .order('created_at', { ascending: true })
                .limit(MESSAGES_TO_LOAD)

            if (error) {
                console.error('Failed to load messages:', error)
                setIsLoading(false)
                return
            }

            if (msgs && msgs.length > 0) {
                const uniqueUserIds = [...new Set(msgs.map(m => m.user_id))]
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url')
                    .in('id', uniqueUserIds)
                const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
                const normalised = await buildMessages(msgs, profileMap)
                setMessages(normalised)
            }

            setIsLoading(false)
            await markAsRead()
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!isLoading) scrollToBottom('instant' as ScrollBehavior)
    }, [isLoading, scrollToBottom])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('global-chat-page')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'global_messages' },
                async (payload) => {
                    const raw = payload.new as { id: string; user_id: string; message: string; created_at: string; reply_to_id?: string | null }

                    // Play ding only for OTHER people's messages
                    if (raw.user_id !== currentUserId) {
                        playDing()
                    }

                    // Fetch sender + possible reply data
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name, avatar_url')
                        .eq('id', raw.user_id)
                        .single()

                    const profileMap = senderData ? { [senderData.id]: senderData } : {}
                    // We need existing profiles in map for reply sender names too
                    setMessages(prev => {
                        const existingProfileMap: Record<string, any> = {}
                        prev.forEach(m => { if (m.sender) existingProfileMap[m.user_id] = m.sender })
                        if (senderData) existingProfileMap[senderData.id] = senderData
                        // Build inline for the single new message
                        const reply = raw.reply_to_id
                            ? prev.find(m => m.id === raw.reply_to_id) ?? null
                            : null
                        const fullMsg: ChatMessage = {
                            ...raw,
                            sender: existingProfileMap[raw.user_id] ?? undefined,
                            reply_to: reply
                                ? {
                                    id: reply.id,
                                    message: reply.message,
                                    user_id: reply.user_id,
                                    sender_name: reply.sender
                                        ? `${reply.sender.first_name} ${reply.sender.last_name}`
                                        : 'Unknown',
                                }
                                : null,
                        }
                        return [...prev, fullMsg]
                    })
                    await markAsRead()
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId])

    useEffect(() => {
        if (messages.length > 0) scrollToBottom()
    }, [messages, scrollToBottom])

    function scrollToMessage(id: string) {
        const el = document.getElementById(`msg-${id}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('highlight-flash')
            setTimeout(() => el.classList.remove('highlight-flash'), 1200)
        }
    }

    function handleReply(msg: ChatMessage) {
        setReplyingTo(msg)
        inputRef.current?.focus()
    }

    function cancelReply() {
        setReplyingTo(null)
    }

    async function handleSend() {
        const text = newMessage.trim()
        if (!text || isSending || !currentUserId) return

        setIsSending(true)
        setNewMessage('')
        const replyId = replyingTo?.id ?? null
        setReplyingTo(null)

        const { error } = await supabase
            .from('global_messages')
            .insert({ message: text, user_id: currentUserId, reply_to_id: replyId })

        if (error) {
            console.error('Failed to send message:', error)
            setNewMessage(text)
        }

        setIsSending(false)
        // Since we no longer disable the textarea, we can focus immediately
        if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.style.height = 'auto'
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
        if (e.key === 'Escape') cancelReply()
    }

    const remaining = MAX_MESSAGE_LENGTH - newMessage.length

    return (
        <>
            {/* Flash animation style */}
            <style>{`
                @keyframes highlightFlash {
                    0%, 100% { background-color: transparent; }
                    30% { background-color: color-mix(in srgb, var(--color-accent, #6366f1) 25%, transparent); }
                }
                .highlight-flash { animation: highlightFlash 1.2s ease; border-radius: 12px; }
                
                /* Layout Lock - Binds the chat interface perfectly to the AppShell */
                main { position: relative !important; display: flex !important; flex-direction: column !important; }
            `}</style>

            <div className="absolute inset-0 flex flex-col px-3 md:px-4 lg:px-6 pt-3 md:pt-4 lg:pt-6 pb-2">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent text-lg">💬</div>
                    <div>
                        <h1 className="text-lg font-bold text-text-primary">Group Chat</h1>
                        <p className="text-xs text-text-muted">All team members • Messages kept for 7 days</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-1 min-h-0 scroll-smooth overflow-x-hidden">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                                <p className="text-sm text-text-muted">Loading messages…</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                            <span className="text-5xl">💬</span>
                            <p className="text-base font-semibold text-text-primary">No messages yet</p>
                            <p className="text-sm text-text-muted">Be the first to say something!</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isOwn = msg.user_id === currentUserId
                            const prev = messages[i - 1]
                            const next = messages[i + 1]

                            // For avatar grouping
                            const sameAuthorAsPrev = prev?.user_id === msg.user_id &&
                                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000

                            const sameAuthorAsNext = next?.user_id === msg.user_id &&
                                new Date(next.created_at).getTime() - new Date(msg.created_at).getTime() < 5 * 60 * 1000

                            // For timestamp display (show on the LAST message of the block)
                            const showTime = !(
                                next &&
                                next.user_id === msg.user_id &&
                                formatTime(next.created_at) === formatTime(msg.created_at)
                            )

                            return (
                                <div key={msg.id}>
                                    {shouldShowDivider(prev, msg) && (
                                        <div className="flex items-center gap-3 my-4 px-2">
                                            <div className="flex-1 h-px bg-border" />
                                            <span className="text-xs text-text-muted font-medium whitespace-nowrap">
                                                {formatDateDivider(msg.created_at)}
                                            </span>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>
                                    )}
                                    <MessageRow
                                        msg={msg}
                                        isOwn={isOwn}
                                        sameAuthorAsPrev={sameAuthorAsPrev}
                                        sameAuthorAsNext={sameAuthorAsNext}
                                        showTime={showTime}
                                        onReply={handleReply}
                                        onScrollTo={scrollToMessage}
                                    />
                                </div>
                            )
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Reply-to preview bar */}
                {replyingTo && (
                    <div className="shrink-0 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 mb-2">
                        <div className="w-0.5 self-stretch rounded-full bg-accent" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-accent">
                                Replying to {replyingTo.user_id === currentUserId ? 'yourself' : (replyingTo.sender ? `${replyingTo.sender.first_name} ${replyingTo.sender.last_name}` : 'Unknown')}
                            </p>
                            <p className="text-xs text-text-muted truncate">{replyingTo.message}</p>
                        </div>
                        <button
                            onClick={cancelReply}
                            className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
                            title="Cancel reply (Esc)"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Input */}
                <div className="shrink-0 border-t border-border pt-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                                onKeyDown={handleKeyDown}
                                placeholder={replyingTo ? 'Write your reply…' : 'Send a message…'}
                                rows={1}
                                style={{ resize: 'none' }}
                                className="w-full block rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
                                onInput={(e) => {
                                    const el = e.currentTarget
                                    el.style.height = 'auto'
                                    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
                                }}
                                id="chat-message-input"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || isSending}
                            id="chat-send-button"
                            className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
                            title="Send (Enter)"
                        >
                            {isSending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className={`mt-1.5 text-right text-[10px] transition-colors ${remaining < 100 ? 'text-amber-400' : 'text-text-muted'}`}>
                        {remaining} characters remaining
                    </div>
                </div>
            </div>
        </>
    )
}

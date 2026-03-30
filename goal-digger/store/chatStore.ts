import { create } from 'zustand'

export interface ChatMessage {
    id: string
    user_id: string
    message: string
    created_at: string
    reply_to_id?: string | null
    reply_to?: {
        id: string
        message: string
        user_id: string
        sender_name?: string
    } | null
    sender?: {
        first_name: string
        last_name: string
        avatar_url: string | null
    }
}

interface ChatState {
    unreadCount: number
    setUnreadCount: (count: number) => void
    incrementUnread: () => void
    clearUnread: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
    incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
    clearUnread: () => set({ unreadCount: 0 }),
}))

/**
 * SENTINEL SOS — Chat Store (Zustand)
 */
import { create } from 'zustand'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: '🛡 **SENTINEL SOS** — Emergency Assistant\n\nI\'m here to help in road emergencies. Tell me what\'s happening, or tap a quick action below.\n\nFor life-threatening emergencies: **CALL 112 / 108 / 100**',
  timestamp: new Date().toISOString(),
}

const useChatStore = create((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  input: '',
  unreadCount: 0,
  isOpen: false,

  setOpen: (v) => set({ isOpen: v, unreadCount: v ? 0 : get().unreadCount }),
  setInput: (v) => set({ input: v }),
  setTyping: (v) => set({ isTyping: v }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Date.now().toString(), timestamp: new Date().toISOString() }],
    unreadCount: state.isOpen ? 0 : state.unreadCount + (msg.role === 'assistant' ? 1 : 0),
  })),

  clearMessages: () => set({ messages: [WELCOME_MESSAGE], unreadCount: 0 }),
}))

export default useChatStore

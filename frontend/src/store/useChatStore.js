import { create } from 'zustand'

const WELCOME_MESSAGE = {
  role: 'bot',
  text: "👋 **Hi! I'm the SentinelAI Road Assistant.**\n\nI can help you with road risk scores, authority contacts, repair budgets, and filing reports.\n\nTry one of the quick actions below or type your question!",
  actions: [],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

const useChatStore = create((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  input: '',
  unreadCount: 0,

  addMessage: (msg) =>
    set(state => ({
      messages: [...state.messages, msg],
      unreadCount: msg.role === 'bot' ? state.unreadCount + 1 : state.unreadCount,
    })),

  setTyping: (v) => set({ isTyping: v }),
  setInput: (v) => set({ input: v }),
  clearUnread: () => set({ unreadCount: 0 }),

  clearMessages: () =>
    set({ messages: [WELCOME_MESSAGE], unreadCount: 0 }),
}))

export default useChatStore

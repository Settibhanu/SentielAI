import React, { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'
import QuickActions from './QuickActions'
import TypingIndicator from './TypingIndicator'
import useChatStore from '../../store/useChatStore'
import apiClient from '../../api/client'
import useAppStore from '../../store/useAppStore'

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * ChatWindow — the main chat interface panel.
 * Handles message sending, API calls, auto-scroll, and keyboard input.
 */
export default function ChatWindow({ onClose }) {
  const { messages, addMessage, setTyping, isTyping, input, setInput } = useChatStore()
  const { selectedZone } = useAppStore()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when window opens
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Add user message
    addMessage({ role: 'user', text: trimmed, timestamp: nowTime() })
    setInput('')
    setTyping(true)

    try {
      const res = await apiClient.post('/chatbot/message', {
        message: trimmed,
        zone_id: selectedZone?.zone_id ?? null,
        lat: null,
        lng: null,
        language: 'en',
      })
      const data = res.data
      addMessage({
        role: 'bot',
        text: data.reply,
        actions: data.actions ?? [],
        intent: data.intent,
        timestamp: nowTime(),
      })
    } catch (err) {
      addMessage({
        role: 'bot',
        text: "Sorry, I couldn't connect to the server. Please check your connection and try again.",
        actions: [],
        timestamp: nowTime(),
      })
    } finally {
      setTyping(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      className="flex flex-col bg-gray-900 rounded-2xl shadow-2xl border border-gray-700
                 w-full sm:w-[380px] h-[520px] sm:h-[560px] overflow-hidden"
      role="dialog"
      aria-label="SentinelAI Road Assistant"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡</span>
          <div>
            <div className="text-sm font-semibold text-white">SentinelAI Assistant</div>
            <div className="text-xs text-emerald-400">Road Safety · Always available</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded
                     min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="py-2 border-t border-gray-800">
        <QuickActions onSelect={sendMessage} disabled={isTyping} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about road risk, repairs, budget…"
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm
                       text-gray-200 placeholder-gray-600 resize-none focus:outline-none
                       focus:ring-2 focus:ring-emerald-500 min-h-[44px] max-h-[100px]"
            aria-label="Type your message"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white rounded-xl px-3 py-2.5 min-w-[44px] min-h-[44px] transition-colors
                       flex items-center justify-center"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

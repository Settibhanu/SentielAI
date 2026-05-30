/**
 * SENTINEL SOS — Chat Window Component
 */
import { useEffect, useRef, useState } from 'react'
import ChatMessage from './ChatMessage'
import QuickActions from './QuickActions'
import TypingIndicator from './TypingIndicator'
import useChatStore from '../../store/useChatStore'
import useGeolocation from '../../hooks/useGeolocation'
import useAppStore from '../../store/useAppStore'
import { sendChatMessage } from '../../services/api'

export default function ChatWindow({ onClose }) {
  const { messages, isTyping, input, setInput, setTyping, addMessage } = useChatStore()
  const { lat, lon } = useGeolocation()
  const { emergencyNumber } = useAppStore()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async (text = input) => {
    const msg = text.trim()
    if (!msg) return

    setInput('')
    addMessage({ role: 'user', content: msg })
    setTyping(true)

    try {
      const response = await sendChatMessage(msg, lat, lon)
      addMessage({
        role: 'assistant',
        content: response.reply,
        actions: response.actions,
      })
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `⚠️ Connection error. For emergencies, call **${emergencyNumber}** immediately.`,
        actions: [],
      })
    } finally {
      setTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-2xl
                 w-[360px] h-[560px] max-h-[80vh] overflow-hidden"
      role="dialog"
      aria-label="SENTINEL SOS Emergency Assistant"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🛡</span>
          <div>
            <p className="font-heading text-sm text-red-400 tracking-wider">SENTINEL</p>
            <p className="text-[10px] text-neutral-500">Emergency Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${emergencyNumber}`}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg
                       font-bold min-h-[32px] flex items-center"
            aria-label={`SOS Call ${emergencyNumber}`}
          >
            🚨 {emergencyNumber}
          </a>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 min-h-[32px] min-w-[32px]
                       flex items-center justify-center"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3" role="log" aria-live="polite">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl rounded-tl-sm">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="py-2 border-t border-neutral-800">
        <QuickActions onSelect={handleSend} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3 pt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your emergency..."
          rows={1}
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2
                     text-sm text-neutral-100 placeholder-neutral-600 resize-none
                     focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[44px]"
          aria-label="Type your emergency message"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white
                     rounded-xl px-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Send message"
        >
          {isTyping ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span aria-hidden="true">↑</span>
          )}
        </button>
      </div>
    </div>
  )
}

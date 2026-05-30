/**
 * SENTINEL SOS — SOS Assistant Page (Full-screen chat)
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatMessage from '../components/chatbot/ChatMessage'
import QuickActions from '../components/chatbot/QuickActions'
import TypingIndicator from '../components/chatbot/TypingIndicator'
import useChatStore from '../store/useChatStore'
import useGeolocation from '../hooks/useGeolocation'
import useAppStore from '../store/useAppStore'
import { sendChatMessage } from '../services/api'

export default function SOSAssistant() {
  const navigate = useNavigate()
  const { messages, isTyping, input, setInput, setTyping, addMessage } = useChatStore()
  const { lat, lon } = useGeolocation()
  const { emergencyNumber } = useAppStore()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

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
    } catch {
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
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3
                      bg-[#111] border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🛡</span>
          <div>
            <h1 className="font-heading text-lg text-red-400 tracking-wider">SENTINEL</h1>
            <p className="text-xs text-neutral-500">Emergency Assistant</p>
          </div>
        </div>
        <a
          href={`tel:${emergencyNumber}`}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white
                     font-heading font-bold text-sm px-3 py-2 rounded-lg min-h-[44px]"
          aria-label={`SOS Call ${emergencyNumber}`}
        >
          🚨 SOS CALL
        </a>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
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
      <div className="shrink-0 py-2 border-t border-neutral-800">
        <QuickActions onSelect={handleSend} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2 px-4 pb-4 pt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your emergency..."
          rows={2}
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5
                     text-sm text-neutral-100 placeholder-neutral-600 resize-none
                     focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[60px]"
          aria-label="Type your emergency message"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white
                     rounded-xl px-4 min-h-[60px] min-w-[52px] flex items-center justify-center
                     text-xl"
          aria-label="Send message"
        >
          {isTyping ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '↑'}
        </button>
      </div>
    </div>
  )
}

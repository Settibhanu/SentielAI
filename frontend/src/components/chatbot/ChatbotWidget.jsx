/**
 * SENTINEL SOS — Floating Chatbot Widget
 */
import { useEffect, useRef } from 'react'
import ChatWindow from './ChatWindow'
import useChatStore from '../../store/useChatStore'

export default function ChatbotWidget() {
  const { isOpen, setOpen, unreadCount } = useChatStore()
  const buttonRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 sm:bottom-6">
          <ChatWindow onClose={() => setOpen(false)} />
        </div>
      )}

      {/* FAB button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 sm:bottom-6
                   w-14 h-14 rounded-full bg-red-600 hover:bg-red-700
                   text-white shadow-lg shadow-red-900/50
                   flex items-center justify-center text-2xl
                   transition-all active:scale-95"
        aria-label={isOpen ? 'Close emergency assistant' : 'Open emergency assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? '✕' : '🛡'}
        {!isOpen && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full
                       text-xs font-bold flex items-center justify-center text-black"
            aria-label={`${unreadCount} unread messages`}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </>
  )
}

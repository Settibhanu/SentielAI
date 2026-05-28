import React, { useState, useEffect, useRef } from 'react'
import ChatWindow from './ChatWindow'
import useChatStore from '../../store/useChatStore'

/**
 * ChatbotWidget — floating action button + chat window overlay.
 *
 * Renders globally in App.jsx (outside Routes) so it persists across pages.
 * Keyboard: Escape closes the window.
 * WCAG AA: focus trap when open, aria-expanded on trigger button.
 */
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const { unreadCount, clearUnread } = useChatStore()
  const triggerRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleOpen() {
    setOpen(true)
    clearUnread()
  }

  return (
    <>
      {/* Chat window — positioned above FAB */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50
                     animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ animation: 'chatSlideIn 0.2s ease-out' }}
        >
          <ChatWindow onClose={() => { setOpen(false); triggerRef.current?.focus() }} />
        </div>
      )}

      {/* Floating trigger button */}
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label={open ? 'Close road assistant' : 'Open road assistant'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50
                   w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95
                   text-white rounded-full shadow-lg shadow-emerald-900/50
                   flex items-center justify-center transition-all duration-200
                   focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs
                       rounded-full flex items-center justify-center font-bold"
            aria-label={`${unreadCount} unread messages`}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </>
  )
}

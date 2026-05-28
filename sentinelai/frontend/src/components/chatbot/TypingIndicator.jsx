import React from 'react'

/**
 * TypingIndicator — animated three-dot pulse shown while bot is "thinking".
 * WCAG: aria-label for screen readers.
 */
export default function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 px-4 py-3 bg-gray-800 rounded-2xl rounded-bl-sm w-fit"
      aria-label="Assistant is typing"
      role="status"
    >
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  )
}
